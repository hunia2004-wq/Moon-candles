"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Your actual label template — used as the BASE layer every time.     */
/* The uploaded photo and typed message are drawn on top of its own    */
/* zones, not reconstructed separately. Whatever's in this image       */
/* outside those two zones (including the watermark) stays visible.    */
/* ------------------------------------------------------------------ */
const LABEL_TEMPLATE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/cust%20placeholder/candle%20placeholder.jpg";

/* ------------------------------------------------------------------ */
/* TUNABLE CONSTANTS — where the label sits on the candle photo, and   */
/* the label's own internal layout (photo zone left, text zone right,  */
/* matching the real reference photo). Nudge these once you see it     */
/* live against your actual candle image.                              */
/* ------------------------------------------------------------------ */

const LABEL_LEFT_PCT = 9;    // label's left edge, as % of candle image width
const LABEL_TOP_PCT = 45;    // label's top edge, as % of candle image height
const LABEL_WIDTH_PCT = 82;  // label's width, as % of candle image width
const LABEL_ASPECT = 3.08;   // matches the real candle placeholder.jpg proportions

// Within the label itself (0-100% of the label's own box) — derived
// directly from the real template's own pixel layout.
const PHOTO_ZONE = { left: 4, top: 8, width: 42, height: 84 };
const TEXT_ZONE = { left: 50, top: 10, width: 46, height: 80 };

const LABEL_CANVAS_W = 900; // internal render resolution for the composite
const LABEL_CANVAS_H = Math.round(LABEL_CANVAS_W / LABEL_ASPECT);

const STRIP_COUNT = 64; // more strips = smoother curve; too few = visible jagged steps

/* ------------------------------------------------------------------ */

export default function CandleLabelWrap({
  candleImg,
  photoUrl,
  message,
  curved = true,
}: {
  candleImg: string;
  photoUrl: string | null;
  message: string;
  curved?: boolean;
}) {
  const [labelDataUrl, setLabelDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Composite the photo + text onto a flat label canvas whenever either
  // input changes. This is the "flat label" step — the curve illusion
  // is applied afterward, in the strip rendering below.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = LABEL_CANVAS_W;
    canvas.height = LABEL_CANVAS_H;

    function drawTextZone() {
      if (!ctx) return;
      const zx = (TEXT_ZONE.left / 100) * LABEL_CANVAS_W;
      const zy = (TEXT_ZONE.top / 100) * LABEL_CANVAS_H;
      const zw = (TEXT_ZONE.width / 100) * LABEL_CANVAS_W;
      const zh = (TEXT_ZONE.height / 100) * LABEL_CANVAS_H;

      ctx.save();
      ctx.font = `italic 600 46px "Brush Script MT", cursive`;
      ctx.fillStyle = "#2A2A2A";
      ctx.textBaseline = "top";

      // basic word-wrap within the text zone
      const words = (message || "Your message here").split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > zw && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      const lineHeight = 56;
      const totalH = lines.length * lineHeight;
      let y = zy + Math.max(0, (zh - totalH) / 2);
      for (const l of lines) {
        ctx.fillText(l, zx, y);
        y += lineHeight;
      }
      ctx.restore();
    }

    function finish() {
      const url = canvas!.toDataURL("image/png");
      setLabelDataUrl(url);
    }

    function drawPhotoAndFinish() {
      if (photoUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const zx = (PHOTO_ZONE.left / 100) * LABEL_CANVAS_W;
          const zy = (PHOTO_ZONE.top / 100) * LABEL_CANVAS_H;
          const zw = (PHOTO_ZONE.width / 100) * LABEL_CANVAS_W;
          const zh = (PHOTO_ZONE.height / 100) * LABEL_CANVAS_H;

          // cover-fit crop into the photo zone
          const srcRatio = img.width / img.height;
          const dstRatio = zw / zh;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (srcRatio > dstRatio) {
            sw = img.height * dstRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / dstRatio;
            sy = (img.height - sh) / 2;
          }
          ctx!.drawImage(img, sx, sy, sw, sh, zx, zy, zw, zh);
          drawTextZone();
          finish();
        };
        img.onerror = () => {
          drawTextZone();
          finish();
        };
        img.src = photoUrl;
      } else {
        // no photo yet — leave the template's own placeholder art showing
        // through in the photo zone, just draw the text on top of it.
        drawTextZone();
        finish();
      }
    }

    // Load the REAL template image first and draw it as the base layer —
    // this is what makes the label look like your actual product design
    // (including anything outside the two zones) rather than a plain
    // generic rectangle.
    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.onload = () => {
      ctx.drawImage(templateImg, 0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
      drawPhotoAndFinish();
    };
    templateImg.onerror = () => {
      // fallback if the template fails to load, so it never renders blank
      ctx.fillStyle = "#FBF8F1";
      ctx.fillRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
      drawPhotoAndFinish();
    };
    templateImg.src = LABEL_TEMPLATE_IMG;
  }, [photoUrl, message]);

  // Flat mode: candle stays visible, but the label sits on it as a plain
  // undistorted rectangle — same position/size as the curved version,
  // just without the strip-wrap effect. Used while editing, so the
  // photo/text are clear and easy to check, not bent by the curve math.
  if (!curved) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <canvas ref={canvasRef} className="hidden" />

        <img src={candleImg} alt="Your candle" className="w-full h-auto" />

        {labelDataUrl && (
          <img
            src={labelDataUrl}
            alt="Your label design"
            className="absolute rounded-sm shadow-md"
            style={{
              left: `${LABEL_LEFT_PCT}%`,
              top: `${LABEL_TOP_PCT}%`,
              width: `${LABEL_WIDTH_PCT}%`,
              aspectRatio: `${LABEL_ASPECT}`,
            }}
          />
        )}
      </div>
    );
  }

  // Curved mode: the label wrapped realistically around the actual candle
  // photo. Used only in the final Preview, matching what's really printed
  // and physically wrapped around the jar.
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* hidden compositing canvas — not shown directly */}
      <canvas ref={canvasRef} className="hidden" />

      <img src={candleImg} alt="Your candle" className="w-full h-auto" />

      {labelDataUrl && (
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${LABEL_LEFT_PCT}%`,
            top: `${LABEL_TOP_PCT}%`,
            width: `${LABEL_WIDTH_PCT}%`,
            aspectRatio: `${LABEL_ASPECT}`,
            display: "flex",
          }}
        >
          {/* Fake-cylinder wrap: the flat label is sliced into thin
              vertical strips, each showing the corresponding slice of
              the composited image via background-position, with a
              per-strip vertical scale following a curve — full height
              at center, tapering at the edges. This is what reads as
              "wrapped around a jar" without any real 3D warping. */}
          {Array.from({ length: STRIP_COUNT }).map((_, i) => {
            const t = (i + 0.5) / STRIP_COUNT; // 0..1 across the label
            // cosine falloff: 1.0 at center, dips toward the edges —
            // amplitude increased again for a more pronounced wrap.
            const curve = 0.6 + 0.4 * Math.sin(t * Math.PI);
            return (
              <div
                key={i}
                style={{
                  flex: "1 0 auto",
                  height: "100%",
                  transform: `scaleY(${curve})`,
                  transformOrigin: "center",
                  backgroundImage: `url(${labelDataUrl})`,
                  backgroundSize: `${STRIP_COUNT * 100}% 100%`,
                  backgroundPosition: `${(i / (STRIP_COUNT - 1)) * 100}% center`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}