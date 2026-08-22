"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Same label template/zones as CandleLabelWrap — kept separate here   */
/* rather than sharing code, so this component can be dropped in       */
/* independently without touching the flat/curved-static one.          */
/* ------------------------------------------------------------------ */
const LABEL_TEMPLATE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/cust%20placeholder/candle%20placeholder.jpg";

const PHOTO_ZONE = { left: 4, top: 8, width: 42, height: 84 };
const TEXT_ZONE = { left: 50, top: 10, width: 46, height: 80 };

const LABEL_CANVAS_W = 900;
const LABEL_ASPECT = 3.08;
const LABEL_CANVAS_H = Math.round(LABEL_CANVAS_W / LABEL_ASPECT);

/* ------------------------------------------------------------------ */
/* TUNABLE — real candle jars aren't fully covered by the label; adjust */
/* these once you see it against your real product's actual proportions. */
/* ------------------------------------------------------------------ */
const PANEL_COUNT = 48;           // total panels around the full circle
const LABEL_ARC_FRACTION = 0.62;  // fraction of the circle the label covers (rest = bare glass)
const CYLINDER_HEIGHT = 260;      // px, height of the label band
const CYLINDER_DIAMETER = 200;    // px, roughly the visual width of the candle
const GLASS_COLOR = "#F4EFE2";    // fallback color for the bare-glass panels
const SPIN_SECONDS = 14;          // full rotation duration

/* ------------------------------------------------------------------ */

export default function CandleSpin3D({
  photoUrl,
  message,
}: {
  photoUrl: string | null;
  message: string;
}) {
  const [labelDataUrl, setLabelDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      setLabelDataUrl(canvas!.toDataURL("image/png"));
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
        drawTextZone();
        finish();
      }
    }

    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.onload = () => {
      ctx.drawImage(templateImg, 0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
      drawPhotoAndFinish();
    };
    templateImg.onerror = () => {
      ctx.fillStyle = "#FBF8F1";
      ctx.fillRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
      drawPhotoAndFinish();
    };
    templateImg.src = LABEL_TEMPLATE_IMG;
  }, [photoUrl, message]);

  const radius = CYLINDER_DIAMETER / 2;
  const labelPanelCount = Math.round(PANEL_COUNT * LABEL_ARC_FRACTION);
  const angleStep = 360 / PANEL_COUNT;
  const panelWidth = 2 * radius * Math.tan((angleStep * Math.PI) / 360) * 1.02; // slight overlap, no seams

  // Label panels are centered in the front-facing arc; the remaining
  // panels around the rest of the circle are bare glass color.
  const labelStartIndex = Math.floor((PANEL_COUNT - labelPanelCount) / 2);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />

      <div
        style={{
          width: CYLINDER_DIAMETER + 40,
          height: CYLINDER_HEIGHT + 60,
          perspective: 900,
        }}
        className="relative flex items-center justify-center"
      >
        {/* Wooden lid, sits above the spinning body, doesn't rotate with it */}
        <div
          className="absolute rounded-full"
          style={{
            top: 0,
            width: CYLINDER_DIAMETER * 0.86,
            height: 22,
            background: "linear-gradient(180deg, #A9764F 0%, #7C5334 100%)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        <div
          style={{
            width: CYLINDER_DIAMETER,
            height: CYLINDER_HEIGHT,
            marginTop: 28,
            position: "relative",
            transformStyle: "preserve-3d",
            animation: `candle-spin ${SPIN_SECONDS}s linear infinite`,
          }}
        >
          {Array.from({ length: PANEL_COUNT }).map((_, i) => {
            const angle = i * angleStep;
            const isLabelPanel =
              i >= labelStartIndex && i < labelStartIndex + labelPanelCount;
            const sliceIndex = i - labelStartIndex;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: panelWidth,
                  height: CYLINDER_HEIGHT,
                  left: "50%",
                  top: 0,
                  marginLeft: -panelWidth / 2,
                  backgroundColor: isLabelPanel ? undefined : GLASS_COLOR,
                  backgroundImage:
                    isLabelPanel && labelDataUrl
                      ? `url(${labelDataUrl})`
                      : undefined,
                  backgroundSize: isLabelPanel
                    ? `${labelPanelCount * 100}% 100%`
                    : undefined,
                  backgroundPosition: isLabelPanel
                    ? `${(sliceIndex / Math.max(1, labelPanelCount - 1)) * 100}% center`
                    : undefined,
                  backgroundRepeat: "no-repeat",
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  boxShadow: isLabelPanel
                    ? "inset 0 0 12px rgba(0,0,0,0.06)"
                    : "inset 0 0 20px rgba(0,0,0,0.08)",
                }}
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes candle-spin {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
      `}</style>

      <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
        Spinning preview — the label covers about {Math.round(LABEL_ARC_FRACTION * 100)}%
        of the way around, matching a real wrapped label.
      </p>
    </div>
  );
}