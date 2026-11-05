"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { Move, X } from "lucide-react";
import {
  Great_Vibes,
  Dancing_Script,
  Playfair_Display,
  Caveat,
  Lora,
} from "next/font/google";

export const PLACEHOLDER_IMG_URL =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/cust%20placeholder/candle%20placeholder.jpg";

const LABEL_ASPECT = 736 / 238;

const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const dancing = Dancing_Script({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"], style: "italic" });

export const LABEL_FONTS = [
  { id: "elegant", name: "Elegant", family: greatVibes.style.fontFamily },
  { id: "flow", name: "Flow", family: dancing.style.fontFamily },
  { id: "classic", name: "Classic", family: playfair.style.fontFamily },
  { id: "hand", name: "Hand", family: caveat.style.fontFamily },
  { id: "soft", name: "Soft", family: lora.style.fontFamily },
] as const;

export const LABEL_BOX: Record<string, { width: number; centerX: number; centerY: number }> = {
  "150": { width: 75, centerX: 50, centerY: 58 },
  "380": { width: 88, centerX: 51, centerY: 63 },
  default: { width: 90, centerX: 50, centerY: 55 },
};

/* ---------- TEXT BOXES ---------- */

export type TextBox = {
  id: string;
  text: string;
  x: number; // % from the left of the plate
  y: number; // % from the top of the plate
  w: number; // % of plate width
  h: number; // % of plate height
  align: "left" | "center" | "right";
  size: number; // font size in cqw (% of plate width)
  fontId: string;
};

export function makeTextBox(p: Partial<TextBox> = {}): TextBox {
  return {
    id: Math.random().toString(36).slice(2),
    text: "",
    x: 3,
    y: 8,
    w: 55,
    h: 50,
    align: "left",
    size: 8,
    fontId: LABEL_FONTS[0].id,
    ...p,
  };
}

const PAD = 3; // draggable frame thickness, in cqw
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
// Padding shrinks with the box, so small boxes still have room for text.
// (55%-wide box → 3cqw, same as before.)
export const TEXT_LIMIT_X = 64; // text may not go past this (% of plate width); photo starts at 65.8
const MIN_FIT = 1;
export const boxPad = (b: { w: number }) => clamp(b.w * 0.06, 0.4, PAD);
const familyOf = (id: string) => (LABEL_FONTS.find((f) => f.id === id) ?? LABEL_FONTS[0]).family;

/* ---------- TOOLBAR (font + alignment of the selected box) ---------- */

export function TextToolbar({
  boxes,
  onBoxesChange,
  selectedId,
}: {
  boxes: TextBox[];
  onBoxesChange: (b: TextBox[]) => void;
  selectedId: string | null;
}) {
  const sel = boxes.find((b) => b.id === selectedId) ?? boxes[boxes.length - 1];
  if (!sel) return null;

  const set = (patch: Partial<TextBox>) =>
    onBoxesChange(boxes.map((b) => (b.id === sel.id ? { ...b, ...patch } : b)));

  const style = (active: boolean) => ({
    border: `1.5px solid ${active ? "#DE4B33" : "rgba(0,0,0,0.12)"}`,
    backgroundColor: active ? "#EFE3C4" : "transparent",
    color: "#000000",
  });

  return (
    <div data-label-keep className="mt-4 flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {LABEL_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => set({ fontId: f.id })}
            className="rounded-full px-4 py-1.5 text-lg transition-colors"
            style={{ fontFamily: f.family, ...style(sel.fontId === f.id) }}
            aria-label={f.name}
          >
            Aa
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => set({ size: clamp(sel.size * 0.9, MIN_FIT, 24) })}
          className="rounded-full px-4 py-1.5 text-xs font-semibold"
          style={style(false)}
        >
          A−
        </button>
        <button
          type="button"
          onClick={() => set({ size: clamp(sel.size * 1.1, MIN_FIT, 24) })}
          className="rounded-full px-4 py-1.5 text-base font-semibold"
          style={style(false)}
        >
          A+
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => set({ align: a })}
            className="rounded-full px-4 py-1.5 text-xs font-semibold"
            style={style(sel.align === a)}
          >
            {a[0].toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>
         {boxes.some((b) => b.id === selectedId) && (
        <button
          type="button"
          onClick={() => onBoxesChange(boxes.filter((b) => b.id !== selectedId))}
          className="rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ border: "1.5px solid rgba(0,0,0,0.12)", color: "#DE4B33" }}
        >
          Delete selected text
        </button>
      )}

      <p className="px-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>
        Tap an empty spot on the label to add another text. Drag a box&apos;s border to move it, or
        drag any edge or corner of the selected box to resize it.
      </p>
    </div>
  );
}

/* ---------- LABEL PLATE ---------- */

type PlateProps = {
  boxes: TextBox[];
  onBoxesChange?: (b: TextBox[]) => void;
  selectedId: string | null;
  onSelect?: (id: string | null) => void;
  photoUrl: string | null;
  onPhotoClick?: () => void;
};


// Text is never hidden: the box grows downward to fit it, and the font only
// shrinks if the box has no more room. When the font size or font changes,
// the box height hugs the text.
function GrowTextarea({
  box,
  textStyle,
  onChange,
  onFocus,
  onFit,
  pendingFocus,
}: {
  box: TextBox;
  textStyle: React.CSSProperties;
  onChange: (text: string) => void;
  onFocus: () => void;
  onFit: (patch: Partial<TextBox>) => void;
  pendingFocus: React.MutableRefObject<string | null>;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const last = useRef<{ size: number; fontId: string } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const holder = el?.parentElement;
    if (!el || !holder) return;

    const padTotal = holder.offsetHeight - el.clientHeight;
    const pxPerPct = holder.offsetHeight / box.h;
    if (!pxPerPct || !isFinite(pxPerPct)) return;

    // Height the text needs at font size s (in cqw).
    const measure = (s: number) => {
      el.style.fontSize = `${s}cqw`;
      el.style.height = "0px";
      const n = el.scrollHeight;
      el.style.height = "";
      return n;
    };

    const prev = last.current;
    const hug = !!prev && (prev.size !== box.size || prev.fontId !== box.fontId);

    let s = box.size;
    let need = measure(s);
    const maxContentPx = (100 - box.y) * pxPerPct - padTotal;

    while (need > maxContentPx + 1 && s > MIN_FIT) {
      s *= 0.95;
      need = measure(s);
    }
    el.style.fontSize = `${s}cqw`;

    const needPct = (need + padTotal) / pxPerPct;
    const wantH = Math.min(100 - box.y, hug ? needPct : Math.max(box.h, needPct));

    last.current = { size: s, fontId: box.fontId };

    if (Math.abs(wantH - box.h) > 0.05 || Math.abs(s - box.size) > 0.05) {
      onFit({ h: wantH, size: s });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.text, box.w, box.h, box.y, box.size, box.fontId]);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (el && pendingFocus.current === box.id) {
          pendingFocus.current = null;
          el.focus();
        }
      }}
      value={box.text}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value.slice(0, 300))}
      placeholder="Type here"
      className="w-full h-full bg-transparent outline-none resize-none placeholder:text-black/40"
      style={{ ...textStyle, overflow: "hidden", cursor: "text" }}
    />
  );
}
type Edge = "n" | "s" | "e" | "w";
type Corner = "nw" | "ne" | "sw" | "se";

// Invisible grab zones along each edge of the selected box.
const EDGE: Record<Edge, { strip: React.CSSProperties; cursor: string }> = {
  n: {
    strip: { left: "2.5cqw", right: "2.5cqw", top: "-2.5cqw", height: "5cqw" },
    cursor: "ns-resize",
  },
  s: {
    strip: { left: "2.5cqw", right: "2.5cqw", bottom: "-2.5cqw", height: "5cqw" },
    cursor: "ns-resize",
  },
  w: {
    strip: { top: "2.5cqw", bottom: "2.5cqw", left: "-2.5cqw", width: "5cqw" },
    cursor: "ew-resize",
  },
  e: {
    strip: { top: "2.5cqw", bottom: "2.5cqw", right: "-2.5cqw", width: "5cqw" },
    cursor: "ew-resize",
  },
};

// Invisible grab zones on each corner of the selected box.
const CORNER: Record<Corner, { zone: React.CSSProperties; cursor: string }> = {
  nw: { zone: { left: "-2.5cqw", top: "-2.5cqw" }, cursor: "nwse-resize" },
  ne: { zone: { right: "-2.5cqw", top: "-2.5cqw" }, cursor: "nesw-resize" },
  sw: { zone: { left: "-2.5cqw", bottom: "-2.5cqw" }, cursor: "nesw-resize" },
  se: { zone: { right: "-2.5cqw", bottom: "-2.5cqw" }, cursor: "nwse-resize" },
};

export function LabelPlate({
  boxes,
  onBoxesChange,
  selectedId,
  onSelect,
  photoUrl,
  onPhotoClick,
}: PlateProps) {
  const plateRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const gesture = useRef<{
    mode: "move" | "scale" | "edge";
    edge?: Edge;
    corner?: Corner;
    id: string;
    px: number;
    py: number;
    box: TextBox;
  } | null>(null);

  const editable = !!onBoxesChange;

  // Keep every box out of the photo area (also fixes older saved designs).
  useEffect(() => {
    if (!onBoxesChange) return;
    if (!boxes.some((b) => b.x + b.w > TEXT_LIMIT_X + 0.01)) return;
    onBoxesChange(
      boxes.map((b) => {
        const w = Math.min(b.w, TEXT_LIMIT_X);
        return { ...b, w, x: clamp(b.x, 0, TEXT_LIMIT_X - w) };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  function update(id: string, patch: Partial<TextBox>) {
    onBoxesChange?.(boxes.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function startGesture(
    e: React.PointerEvent<HTMLElement>,
    mode: "move" | "scale" | "edge",
    b: TextBox,
    edge?: Edge,
    corner?: Corner
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect?.(b.id);
    gesture.current = { mode, edge, corner, id: b.id, px: e.clientX, py: e.clientY, box: b };
  }

  function onMove(e: React.PointerEvent<HTMLElement>) {
    const g = gesture.current;
    const rect = plateRef.current?.getBoundingClientRect();
    if (!g || !rect) return;

    const dx = ((e.clientX - g.px) / rect.width) * 100;
    const dy = ((e.clientY - g.py) / rect.height) * 100;
    const b = g.box;
    const MIN_W = 6;
    const MIN_H = 4;

    if (g.mode === "move") {
      update(g.id, {
        x: clamp(b.x + dx, 0, TEXT_LIMIT_X - b.w),
        y: clamp(b.y + dy, 0, 100 - b.h),
      });
    } else if (g.mode === "scale") {
      // Corner grab zones: box and text scale together, anchored to the opposite corner.
      const c = g.corner ?? "se";
      const west = c.includes("w");
      const north = c.includes("n");
      const gx = west ? -dx : dx;
      const gy = north ? -dy : dy;
      const maxW = west ? b.x + b.w : TEXT_LIMIT_X - b.x;
      const maxH = north ? b.y + b.h : 100 - b.y;
      const maxRatio = Math.min(maxW / b.w, maxH / b.h);
      const minRatio = Math.min(MIN_W / b.w, maxRatio);
      const ratio = clamp(1 + (gx / b.w + gy / b.h) / 2, minRatio, maxRatio);
      const w = b.w * ratio;
      const h = b.h * ratio;
      update(g.id, {
        w,
        h,
        x: west ? b.x + b.w - w : b.x,
        y: north ? b.y + b.h - h : b.y,
        size: clamp(b.size * ratio, MIN_FIT, 24),
      });
    } else {
      // Edge bars: move one side only. The text rewraps and never gets hidden.
      const patch: Partial<TextBox> = {};
      if (g.edge === "e") {
        patch.w = clamp(b.w + dx, MIN_W, TEXT_LIMIT_X - b.x);
      } else if (g.edge === "w") {
        const nx = clamp(b.x + dx, 0, b.x + b.w - MIN_W);
        patch.x = nx;
        patch.w = b.w + (b.x - nx);
      } else if (g.edge === "s") {
        patch.h = clamp(b.h + dy, MIN_H, 100 - b.y);
      } else if (g.edge === "n") {
        const ny = clamp(b.y + dy, 0, b.y + b.h - MIN_H);
        patch.y = ny;
        patch.h = b.h + (b.y - ny);
      }
      update(g.id, patch);
    }
  }

  function endGesture() {
    gesture.current = null;
  }

  // Tap on an empty part of the label: start a new text box there.
  function onPlateDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!editable || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tx = ((e.clientX - rect.left) / rect.width) * 100;
    const ty = ((e.clientY - rect.top) / rect.height) * 100;

    const x = clamp(tx, 0, TEXT_LIMIT_X - 20);
    const nb = makeTextBox({
      x,
      y: clamp(ty, 0, 50),
      w: Math.min(45, TEXT_LIMIT_X - x),
      h: 30,
      size: 8,
    });

    pendingFocus.current = nb.id;
    onBoxesChange!([...boxes.filter((b) => b.text.trim()), nb]);
    onSelect?.(nb.id);
  }

  return (
    <div
      ref={plateRef}
      data-label-keep
      onPointerDown={onPlateDown}
      className="relative w-full h-full overflow-hidden rounded-lg shadow-md"
      style={{
        containerType: "inline-size",
        backgroundColor: "#FFFFFF",
        backgroundImage: `url("${PLACEHOLDER_IMG_URL}")`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {boxes.map((b) => {
        const selected = editable && b.id === selectedId;
        const textStyle = {
          fontFamily: familyOf(b.fontId),
          fontSize: `${b.size}cqw`,
          lineHeight: 1.15,
          color: "#000000",
          textAlign: b.align,
          padding: 0,
          margin: 0,
        } as const;

        return (
          <div
            key={b.id}
            className="absolute"
            onPointerDown={
              editable
                ? (e) => {
                    if (e.target === e.currentTarget) startGesture(e, "move", b);
                  }
                : undefined
            }
            onPointerMove={onMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              padding: `${boxPad(b)}cqw`,
              boxSizing: "border-box",
              borderRadius: 0,
              outline: editable
                ? selected
                  ? "2px solid #DE4B33"
                  : selectedId
                    ? "1px dashed rgba(0,0,0,0.3)"
                    : "none"
                : "none",
              outlineOffset: 0,
              cursor: editable ? "move" : "auto",
              touchAction: editable ? "none" : "auto",
            }}
          >
            {editable ? (
              <GrowTextarea
                box={b}
                textStyle={textStyle}
                pendingFocus={pendingFocus}
                onFocus={() => onSelect?.(b.id)}
                onChange={(text) => update(b.id, { text })}
                onFit={(patch) => update(b.id, patch)}
              />
            ) : (
              <p className="w-full whitespace-pre-wrap break-words" style={textStyle}>
                {b.text}
              </p>
            )}

            {selected && (
              <>
                {/* Edge grab zones: resize from the left, right, top or bottom */}
                {(["n", "s", "e", "w"] as const).map((edge) => (
                  <div
                    key={edge}
                    aria-label={`Resize ${edge}`}
                    onPointerDown={(e) => startGesture(e, "edge", b, edge)}
                    onPointerMove={onMove}
                    onPointerUp={endGesture}
                    onPointerCancel={endGesture}
                    className="absolute"
                    style={{
                      ...EDGE[edge].strip,
                      cursor: EDGE[edge].cursor,
                      touchAction: "none",
                    }}
                  />
                ))}

                {/* Corner grab zones: resize diagonally, box and text together */}
                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <div
                    key={corner}
                    aria-label={`Resize ${corner}`}
                    onPointerDown={(e) => startGesture(e, "scale", b, undefined, corner)}
                    onPointerMove={onMove}
                    onPointerUp={endGesture}
                    onPointerCancel={endGesture}
                    className="absolute"
                    style={{
                      ...CORNER[corner].zone,
                      width: "5cqw",
                      height: "5cqw",
                      cursor: CORNER[corner].cursor,
                      touchAction: "none",
                    }}
                  />
                ))}

                {/* MOVE handle (top-left) */}
                <div
                  aria-label="Move text"
                  onPointerDown={(e) => startGesture(e, "move", b)}
                  onPointerMove={onMove}
                  onPointerUp={endGesture}
                  onPointerCancel={endGesture}
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: "-1.5cqw",
                    top: "-1.5cqw",
                    width: "5cqw",
                    height: "5cqw",
                    backgroundColor: "#DE4B33",
                    border: "0.6cqw solid #FFF4E6",
                    color: "#FFF4E6",
                    cursor: "move",
                    touchAction: "none",
                  }}
                >
                  <Move style={{ width: "60%", height: "60%" }} strokeWidth={2.5} />
                </div>

                {/* DELETE handle (top-right) */}
                <div
                  aria-label="Delete text"
                  role="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBoxesChange?.(boxes.filter((x) => x.id !== b.id));
                    onSelect?.(null);
                  }}
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    right: "-1.5cqw",
                    top: "-1.5cqw",
                    width: "5cqw",
                    height: "5cqw",
                    backgroundColor: "#DE4B33",
                    border: "0.6cqw solid #FFF4E6",
                    color: "#FFF4E6",
                    cursor: "pointer",
                    touchAction: "none",
                  }}
                >
                  <X style={{ width: "60%", height: "60%" }} strokeWidth={3} />
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Photo */}
      <button
        type="button"
        onClick={onPhotoClick}
        onPointerDown={editable ? () => onSelect?.(null) : undefined}
        className="absolute overflow-hidden"
        style={{ left: "65.8%", top: "10%", width: "27%", height: "83%" }}
        aria-label="Add your photo"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-1">
            <span
              className="rounded-full px-[6%] py-[4%] font-semibold text-center leading-tight"
              style={{
                fontSize: "3.4cqw",
                backgroundColor: "rgba(255,255,255,0.88)",
                color: "#DE4B33",
              }}
            >
              Add your photo here
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

/* ---------- CANDLE + LABEL ---------- */

type Props = {
  candleImg: string;
  photoUrl: string | null;
  sizeKey?: string;
  onPhotoZoneClick?: () => void;
  size?: Record<string, unknown>;
  boxes: TextBox[];
  onBoxesChange?: (b: TextBox[]) => void;
  selectedId: string | null;
  onSelect?: (id: string | null) => void;
};

export default function CandleLabelWrap({
  candleImg,
  photoUrl,
  sizeKey = "default",
  size,
  onPhotoZoneClick,
  boxes,
  onBoxesChange,
  selectedId,
  onSelect,
}: Props) {
  const { img: _ignore, ...sizeInfo } = (size ?? {}) as Record<string, unknown>;
  const sizeText = JSON.stringify(sizeInfo);
  const foundKey = Object.keys(LABEL_BOX).find((k) => k !== "default" && sizeText.includes(k));
  const box = LABEL_BOX[foundKey ?? sizeKey] ?? LABEL_BOX.default;

  // Pressing anywhere outside the label and the toolbar unselects the text box.
  useEffect(() => {
    if (!onBoxesChange || !onSelect) return;
    const handler = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.("[data-label-keep]")) return;
      onSelect(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onBoxesChange, onSelect]);

  return (
    <div className="w-full max-w-md">
      <div className="relative w-full">
        <img src={candleImg} alt="" className="w-full object-contain" />
        <div
          className="absolute"
          style={{
            left: `${box.centerX}%`,
            top: `${box.centerY}%`,
            width: `${box.width}%`,
            aspectRatio: `${LABEL_ASPECT} / 1`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <LabelPlate
            boxes={boxes}
            onBoxesChange={onBoxesChange}
            selectedId={selectedId}
            onSelect={onSelect}
            photoUrl={photoUrl}
            onPhotoClick={onPhotoZoneClick}
          />
        </div>
      </div>

      {onBoxesChange && (
        <TextToolbar boxes={boxes} onBoxesChange={onBoxesChange} selectedId={selectedId} />
      )}
    </div>
  );
}