"use client";

import { useEffect, useState } from "react";

// Shared by every card on the page, so each picture is processed only once.
const resolved = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

const SCAN_SIZE = 160; // pictures are scanned at this size, not full resolution
const OUT_SIZE = 640; // largest size of the cropped picture

function centerImage(src: string, paddingRatio: number): Promise<string> {
  const key = `${src}|${paddingRatio}`;

  const done = resolved.get(key);
  if (done) return Promise.resolve(done);

  const running = pending.get(key);
  if (running) return running;

  const job = new Promise<string>((resolve) => {
    const finish = (value: string) => {
      resolved.set(key, value);
      pending.delete(key);
      resolve(value);
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;

    img.onerror = () => finish(src);

    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return finish(src);

        // 1. Scan a small copy to find the product's bounding box.
        const scale = Math.min(1, SCAN_SIZE / Math.max(w, h));
        const sw = Math.max(1, Math.round(w * scale));
        const sh = Math.max(1, Math.round(h * scale));

        const scan = document.createElement("canvas");
        scan.width = sw;
        scan.height = sh;
        const sctx = scan.getContext("2d", { willReadFrequently: true });
        if (!sctx) return finish(src);

        sctx.drawImage(img, 0, 0, sw, sh);
        const { data } = sctx.getImageData(0, 0, sw, sh);

        let top = sh;
        let bottom = -1;
        let left = sw;
        let right = -1;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (data[(y * sw + x) * 4 + 3] > 10) {
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }

        // Nothing transparent to trim (e.g. a photo): use the picture as it is.
        if (right < left || bottom < top) return finish(src);

        // 2. Bounding box in real picture pixels.
        const bl = Math.max(0, left / scale);
        const br = Math.min(w, (right + 1) / scale);
        const bt = Math.max(0, top / scale);
        const bb = Math.min(h, (bottom + 1) / scale);

        const cx = (bl + br) / 2;
        const cy = (bt + bb) / 2;
        const side = Math.max(br - bl, bb - bt) * (1 + paddingRatio);

        // 3. Square crop centered on the box. The part of the square that falls
        // outside the picture stays empty, and the picture is drawn at its true
        // proportions (no stretching in Safari).
        const sx = cx - side / 2;
        const sy = cy - side / 2;

        const outSize = Math.max(1, Math.round(Math.min(side, OUT_SIZE)));
        const k = outSize / side;

        const ix0 = Math.max(sx, 0);
        const iy0 = Math.max(sy, 0);
        const ix1 = Math.min(sx + side, w);
        const iy1 = Math.min(sy + side, h);

        const out = document.createElement("canvas");
        out.width = outSize;
        out.height = outSize;
        const octx = out.getContext("2d");
        if (!octx) return finish(src);

        octx.drawImage(
          img,
          ix0,
          iy0,
          ix1 - ix0,
          iy1 - iy0,
          (ix0 - sx) * k,
          (iy0 - sy) * k,
          (ix1 - ix0) * k,
          (iy1 - iy0) * k
        );

        finish(out.toDataURL("image/png"));
      } catch {
        // Storage CORS can block reading pixels: show the original instead.
        finish(src);
      }
    };
  });

  pending.set(key, job);
  return job;
}

/**
 * Renders an image cropped to its visible content and centered exactly on
 * the product's bounding box, so every product sits in the middle of its card.
 */
export default function AutoCenteredImage({
  src,
  alt,
  className,
  style,
  paddingRatio = 0.3,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  paddingRatio?: number;
}) {
  const key = `${src}|${paddingRatio}`;
  const [croppedSrc, setCroppedSrc] = useState<string | null>(() => resolved.get(key) ?? null);

  useEffect(() => {
    let cancelled = false;

    const hit = resolved.get(key);
    if (hit) {
      setCroppedSrc(hit);
      return;
    }

    setCroppedSrc(null);
    centerImage(src, paddingRatio).then((result) => {
      if (!cancelled) setCroppedSrc(result);
    });

    return () => {
      cancelled = true;
    };
  }, [src, paddingRatio, key]);

  return (
    <img
      src={croppedSrc ?? src}
      alt={alt}
      className={className}
      style={{
        objectFit: "contain",
        opacity: croppedSrc ? 1 : 0.4,
        transition: "opacity 0.15s",
        ...style,
      }}
    />
  );
}