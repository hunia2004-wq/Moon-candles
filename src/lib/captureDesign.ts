import { toCanvas } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

// Waits until React has finished painting after a state change.
export function nextPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

type SceneLayer = {
  type: string;
  colors?: string[];
  src?: string;
  x: number;
  y: number;
  scale: number;
};

// Describes what to draw under the text: the product picture, the
// customer's color/photo layers, and the shape they are cut to.
export type DesignScene = {
  baseImageUrl: string;
  layers: SceneLayer[];
  shape:
    | { kind: "mask"; clipBottomPct: number } // fan: cut to the fan picture itself
    | { kind: "circle"; xPct: number; yPct: number; diameterPct: number }; // tambourine drum
};

type GetBitmap = (url: string) => Promise<ImageBitmap>;

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors", cache: "reload" });
  if (!res.ok) throw new Error(`Could not download image (${res.status}): ${url}`);
  return res.blob();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

// Paints one color/blend/photo layer into a w x h box, the same way the
// page shows it.
async function paintBackground(
  ctx: CanvasRenderingContext2D,
  layer: SceneLayer,
  w: number,
  h: number,
  getBitmap: GetBitmap
) {
  if (layer.type === "fill") {
    const colors = layer.colors ?? ["#FFFFFF"];

    if (colors.length === 1) {
      ctx.fillStyle = colors[0];
    } else {
      // CSS linear-gradient(135deg, ...)
      const angle = (135 * Math.PI) / 180;
      const dx = Math.sin(angle);
      const dy = -Math.cos(angle);
      const length = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
      const cx = w / 2;
      const cy = h / 2;
      const gradient = ctx.createLinearGradient(
        cx - (dx * length) / 2,
        cy - (dy * length) / 2,
        cx + (dx * length) / 2,
        cy + (dy * length) / 2
      );
      colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = gradient;
    }

    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (layer.type === "pattern" && layer.src) {
    const bitmap = await getBitmap(layer.src);

    // Same math as the page: photo covers the box, then pan and zoom.
    const zoom = layer.scale;
    const maxPanPct = (zoom - 1) * 50;
    const offsetXPct = ((layer.x - 50) / 50) * maxPanPct;
    const offsetYPct = ((layer.y - 50) / 50) * maxPanPct;

    const cover = Math.max(w / bitmap.width, h / bitmap.height);
    const drawW = bitmap.width * cover;
    const drawH = bitmap.height * cover;

    ctx.save();
    ctx.translate(w / 2 + (w * offsetXPct) / 100, h / 2 + (h * offsetYPct) / 100);
    ctx.scale(zoom, zoom);
    ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }
}

// The text is the one part the screenshot library has always drawn
// correctly, so it still takes the picture of it. Everything else on the
// stage is hidden, and the result is a transparent picture of just the text.
async function captureTextOverlay(
  element: HTMLElement,
  pixelRatio: number,
  baseDataUrl: string
): Promise<HTMLCanvasElement> {
  const undo: (() => void)[] = [];

  try {
    for (const child of Array.from(element.children) as HTMLElement[]) {
      if (child.dataset.textLayer) continue;

      if (child instanceof HTMLImageElement) {
        // The product picture: keep its space (so the stage keeps its
        // height) but hide it. Embed it so nothing is fetched mid-capture.
        const originalSrc = child.getAttribute("src");
        const originalVisibility = child.style.visibility;
        child.src = baseDataUrl;
        await child.decode().catch(() => {});
        child.style.visibility = "hidden";
        undo.push(() => {
          if (originalSrc) child.setAttribute("src", originalSrc);
          child.style.visibility = originalVisibility;
        });
      } else {
        const originalDisplay = child.style.display;
        child.style.display = "none";
        undo.push(() => {
          child.style.display = originalDisplay;
        });
      }
    }

    // Safari/iOS often returns a wrong first picture. A quick small
    // first pass warms it up so the real one comes out right.
    await toCanvas(element, { pixelRatio: 1, cacheBust: false });
    return await toCanvas(element, { pixelRatio, cacheBust: false });
  } finally {
    undo.reverse().forEach((fn) => fn());
  }
}

// Builds the finished design picture and uploads it. targetWidthPx is how
// wide the picture should be (2000 px is about 17 cm at print quality).
export async function captureAndUploadDesign(
  element: HTMLElement,
  fileNameHint: string,
  targetWidthPx: number,
  scene: DesignScene
): Promise<string | null> {
  try {
    await document.fonts.ready;

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const pixelRatio = Math.min(16, Math.max(2, targetWidthPx / width));
    const outW = Math.round(width * pixelRatio);
    const outH = Math.round(height * pixelRatio);

    const bitmaps = new Map<string, Promise<ImageBitmap>>();
    const getBitmap: GetBitmap = (url) => {
      if (!bitmaps.has(url)) {
        bitmaps.set(url, fetchBlob(url).then((blob) => createImageBitmap(blob)));
      }
      return bitmaps.get(url)!;
    };

    const baseBlob = await fetchBlob(scene.baseImageUrl);
    const baseBitmap = await createImageBitmap(baseBlob);
    const baseDataUrl = await blobToDataUrl(baseBlob);

    // 1. White paper, then the product picture.
    const canvas = makeCanvas(outW, outH);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(baseBitmap, 0, 0, outW, outH);

    // 2. The customer's color or photo, cut to the product's shape.
    const backgroundLayer = scene.layers.find((l) => l.type === "fill" || l.type === "pattern");

    if (backgroundLayer) {
      if (scene.shape.kind === "mask") {
        const layerCanvas = makeCanvas(outW, outH);
        const lctx = layerCanvas.getContext("2d")!;
        await paintBackground(lctx, backgroundLayer, outW, outH, getBitmap);

        // Keep only the part that overlaps the fan picture.
        lctx.globalCompositeOperation = "destination-in";
        lctx.drawImage(baseBitmap, 0, 0, outW, outH);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, outW, outH * (1 - scene.shape.clipBottomPct / 100));
        ctx.clip();
        ctx.drawImage(layerCanvas, 0, 0);
        ctx.restore();
      } else {
        const diameter = (outW * scene.shape.diameterPct) / 100;
        const centerX = (outW * scene.shape.xPct) / 100;
        const centerY = (outH * scene.shape.yPct) / 100;

        const layerCanvas = makeCanvas(diameter, diameter);
        const lctx = layerCanvas.getContext("2d")!;
        await paintBackground(lctx, backgroundLayer, layerCanvas.width, layerCanvas.height, getBitmap);

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, diameter / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(layerCanvas, centerX - diameter / 2, centerY - diameter / 2);
        ctx.restore();
      }
    }

    // 3. The text, on top.
    const overlay = await captureTextOverlay(element, pixelRatio, baseDataUrl);
    ctx.drawImage(overlay, 0, 0, outW, outH);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not create the picture"))),
        "image/png"
      )
    );

    const supabase = createClient();
    const safeName = fileNameHint.replace(/[^a-zA-Z0-9-_]+/g, "-");
    const path = `designs/${crypto.randomUUID()}-${safeName}.png`;

    const { error: uploadError } = await supabase.storage
      .from("customer-uploads")
      .upload(path, blob, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.error("Design capture upload failed:", uploadError.message);
      return null;
    }

    return supabase.storage.from("customer-uploads").getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.error("Design capture failed:", err);
    return null;
  }
}