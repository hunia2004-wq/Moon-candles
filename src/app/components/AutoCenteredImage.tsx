"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders an image auto-cropped to its non-transparent content, so a PNG
 * with uneven transparent padding on one side still appears visually
 * centered — instead of relying on manual per-image offset guessing.
 *
 * Falls back to rendering the original image normally (object-contain)
 * while cropping is in progress, or if the image has no transparency
 * to trim (e.g. a  JPG with a white background).
 */
export default function AutoCenteredImage({
  src,
  alt,
  className,
  style,
  paddingRatio = 0.35,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  paddingRatio?: number;
}) {
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const cache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const cached = cache.current.get(src);
    if (cached) {
      setCroppedSrc(cached);
      return;
    }

    setCroppedSrc(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (cancelled) return;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, img.width, img.height);

        let top = img.height;
        let bottom = 0;
        let left = img.width;
        let right = 0;
        let hasAlpha = false;

        // Track both the bounding box AND a weighted centroid (center of
        // visual mass). A simple bounding-box center treats a big empty
        // lid and a small dense jar as equally "important," which still
        // looks lopsided even when perfectly boxed. Weighting by alpha
        // (and how opaque/solid each pixel is) centers on where the
        // actual visual weight sits instead.
        let sumX = 0;
        let sumY = 0;
        let totalWeight = 0;

        for (let y = 0; y < img.height; y += 2) {
          for (let x = 0; x < img.width; x += 2) {
            const i = (y * img.width + x) * 4;
            const alpha = data[i + 3];
            if (alpha > 10) {
              hasAlpha = true;
              if (x < left) left = x;
              if (x > right) right = x;
              if (y < top) top = y;
              if (y > bottom) bottom = y;

              // Weight by alpha so faint/antialiased edge pixels count
              // less than solid, fully-opaque ones.
              const weight = alpha / 255;
              sumX += x * weight;
              sumY += y * weight;
              totalWeight += weight;
            }
          }
        }

        // No meaningful transparency found (e.g. a JPG or fully opaque
        // PNG) — nothing to trim, fall back to the original image.
        if (!hasAlpha || right <= left || bottom <= top || totalWeight === 0) {
          cache.current.set(src, src);
          if (!cancelled) setCroppedSrc(src);
          return;
        }

        const centroidX = sumX / totalWeight;
        const centroidY = sumY / totalWeight;

        const contentWidth = right - left;
        const contentHeight = bottom - top;

        // The crop must still fully cover the bounding box even though
        // we're centering on the centroid, not the box center — so size
        // it to the farthest edge from the centroid in either direction.
        const halfSpan = Math.max(
          centroidX - left,
          right - centroidX,
          centroidY - top,
          bottom - centroidY
        );

        const padding = halfSpan * paddingRatio;
        const half = halfSpan + padding;
        const size = half * 2;

        const cropX = centroidX - half;
        const cropY = centroidY - half;

        const outCanvas = document.createElement("canvas");
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) return;

        outCtx.drawImage(img, cropX, cropY, size, size, 0, 0, size, size);

        const result = outCanvas.toDataURL("image/png");
        cache.current.set(src, result);
        if (!cancelled) setCroppedSrc(result);
      } catch {
        // Cross-origin canvas read can fail depending on storage CORS
        // config — fall back to the original image rather than breaking.
        cache.current.set(src, src);
        if (!cancelled) setCroppedSrc(src);
      }
    };

    img.onerror = () => {
      if (!cancelled) setCroppedSrc(src);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

 return (
  <img
    src={croppedSrc ?? src}
    alt={alt}
    className={className}
    style={{ opacity: croppedSrc ? 1 : 0.4, transition: "opacity 0.15s", ...style }}
  />
);
}