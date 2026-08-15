"use client";

import { useState, useRef, useCallback } from "react";

const ACCENT = "#DE4B33";
const PRICE = 25;

const FAN_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customized%20fan/custom%20fan.png";

const COLORS = ["#DE4B33", "#D8A1AF", "#8FAA82", "#6E86C7", "#F4C77A", "#556B2F", "#000000", "#FFFFFF"];

/* ------------------------------------------------------------------ */
/*  Layer model                                                        */
/* ------------------------------------------------------------------ */

type BaseLayer = {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

type TextLayer = BaseLayer & {
  type: "text";
  role: "monogram" | "message";
  content: string;
  fontSize: number;
  color: string;
  // NEW: optional readable background behind the text, since text sitting
  // directly on a busy uploaded pattern can be hard to see.
  bgColor: string | null;
};

type PatternLayer = BaseLayer & {
  type: "pattern";
  src: string;
  tint: string | null;
};

type Layer = TextLayer | PatternLayer;

type SideId = "front" | "back";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultLayersForSide(): Layer[] {
  return [];
}

export default function CustomizeFanPage() {
  const [activeSide, setActiveSide] = useState<SideId>("front");
  const [layersBySide, setLayersBySide] = useState<Record<SideId, Layer[]>>({
    front: defaultLayersForSide(),
    back: defaultLayersForSide(),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const nextZ = useRef(1);
  const patternFileInputRef = useRef<HTMLInputElement>(null);

  const layers = layersBySide[activeSide];
  const otherSide: SideId = activeSide === "front" ? "back" : "front";

  function setLayers(updater: (prev: Layer[]) => Layer[]) {
    setLayersBySide((prev) => ({ ...prev, [activeSide]: updater(prev[activeSide]) }));
  }

  function addText(role: "monogram" | "message") {
    const id = makeId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        role,
        content: role === "monogram" ? "Y & J" : "Your message",
        fontSize: role === "monogram" ? 20 : 13,
        color: "#000000",
        bgColor: "#FFFFFF", // default ON, so text is readable right away
        x: 50,
        y: role === "monogram" ? 42 : 70,
        scale: 1,
        rotation: 0,
        z: nextZ.current++,
      },
    ]);
    setSelectedId(id);
  }

  function handlePatternUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image under 8MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const id = makeId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "pattern",
        src: url,
        tint: null,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        z: 0,
      },
    ]);
    setSelectedId(id);
    e.target.value = "";
  }

  // NEW: copy the selected pattern layer onto the other side, matching
  // its position/scale/rotation/tint exactly. Replaces any existing
  // pattern layer(s) on that side rather than stacking multiple.
  function applyPatternToBothSides(layer: PatternLayer) {
    const copy: PatternLayer = { ...layer, id: makeId(), z: 0 };
    setLayersBySide((prev) => ({
      ...prev,
      [otherSide]: [...prev[otherSide].filter((l) => l.type !== "pattern"), copy],
    }));
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    setLayers((prev) => prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function bringToFront(id: string) {
    updateLayer(id, { z: nextZ.current++ });
  }

  const handlePointerDown = useCallback((id: string) => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragId.current = id;
    setSelectedId(id);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragId.current || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
      updateLayer(dragId.current, { x: xPct, y: yPct });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSide]
  );

  const handlePointerUp = useCallback(() => {
    dragId.current = null;
  }, []);

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  function renderLayer(layer: Layer, interactive: boolean) {
    const isSelected = interactive && layer.id === selectedId;
    const commonStyle: React.CSSProperties = {
      position: "absolute",
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
      cursor: interactive ? "grab" : "default",
      outline: isSelected ? `1.5px dashed ${ACCENT}` : "none",
      outlineOffset: "4px",
    };

    if (layer.type === "pattern") {
      return (
        <div
          key={layer.id}
          onPointerDown={interactive ? handlePointerDown(layer.id) : undefined}
          style={{
            ...commonStyle,
            width: "100%",
            aspectRatio: "3 / 2",
            clipPath: "inset(0 0 22% 0)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              WebkitMaskImage: `url(${FAN_IMG})`,
              maskImage: `url(${FAN_IMG})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              position: "relative",
              isolation: "isolate",
            }}
          >
            <img
              src={layer.src}
              alt="Your uploaded pattern"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {layer.tint && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: layer.tint,
                  mixBlendMode: "color",
                  opacity: 0.85,
                }}
              />
            )}
          </div>
        </div>
      );
    }

    // Text layer — with an optional background "chip" behind it so the
    // words stay readable even over a busy uploaded pattern.
    return (
      <div
        key={layer.id}
        onPointerDown={interactive ? handlePointerDown(layer.id) : undefined}
        style={{
          ...commonStyle,
          fontSize: layer.fontSize,
          fontWeight: layer.role === "monogram" ? 700 : 500,
          color: layer.color,
          whiteSpace: "nowrap",
          fontFamily: layer.role === "monogram" ? "serif" : "inherit",
          backgroundColor: layer.bgColor ?? "transparent",
          padding: layer.bgColor ? "4px 10px" : 0,
          borderRadius: layer.bgColor ? 8 : 0,
          boxShadow: layer.bgColor ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
          textShadow: layer.bgColor ? "none" : "0 1px 2px rgba(255,255,255,0.6)",
        }}
      >
        {layer.content}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      {/* ---------------- TOP: live editor stage ---------------- */}
      <div className="flex flex-col items-center px-6 py-8">
        <div className="flex gap-2 mb-4">
          {(["front", "back"] as SideId[]).map((id) => (
            <button
              key={id}
              onClick={() => {
                setActiveSide(id);
                setSelectedId(null);
              }}
              className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: activeSide === id ? ACCENT : "#FFFFFF",
                color: activeSide === id ? "#FFF4E6" : ACCENT,
                border: `1px solid ${ACCENT}`,
              }}
            >
              {id === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className="relative w-full max-w-[300px] md:max-w-[380px] touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={(e) => {
            if (e.target === stageRef.current) setSelectedId(null);
          }}
        >
          <img
            src={FAN_IMG}
            alt={`Fan — ${activeSide}`}
            className="w-full h-auto pointer-events-none"
            draggable={false}
          />

          {layers
            .slice()
            .sort((a, b) => a.z - b.z)
            .map((layer) => renderLayer(layer, true))}
        </div>

        {/* Selected-layer controls */}
        {selectedLayer && (
          <div
            className="mt-4 flex w-full max-w-[320px] flex-col gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "#EFE3C4" }}
          >
            {selectedLayer.type === "text" && (
              <input
                value={selectedLayer.content}
                onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ border: `1px solid ${ACCENT}`, backgroundColor: "#FFFFFF", color: "#000000" }}
                placeholder={selectedLayer.role === "monogram" ? "Your initials" : "Your message"}
              />
            )}

            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                {selectedLayer.type === "pattern" ? "Space used" : "Size"}
              </span>
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.05}
                value={selectedLayer.scale}
                onChange={(e) => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>Rotate</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selectedLayer.rotation}
                onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                {selectedLayer.type === "pattern" ? "Tint" : "Color"}
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {selectedLayer.type === "pattern" && (
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { tint: null })}
                    className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor: "#FFFFFF",
                      backgroundImage:
                        "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                      borderColor: selectedLayer.tint === null ? "#000000" : "rgba(0,0,0,0.3)",
                      borderWidth: selectedLayer.tint === null ? 2 : 1,
                    }}
                    title="No tint"
                  />
                )}
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      updateLayer(
                        selectedLayer.id,
                        selectedLayer.type === "pattern" ? { tint: c } : { color: c }
                      )
                    }
                    className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor:
                        (selectedLayer.type === "pattern" ? selectedLayer.tint : selectedLayer.color) === c
                          ? "#000000"
                          : "transparent",
                      borderWidth:
                        (selectedLayer.type === "pattern" ? selectedLayer.tint : selectedLayer.color) === c
                          ? 2
                          : 1,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* NEW: readable background toggle, text layers only */}
            {selectedLayer.type === "text" && (
              <div className="flex items-center gap-2">
                <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>Backing</span>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  <button
                    onClick={() => updateLayer(selectedLayer.id, { bgColor: null })}
                    className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor: "#FFFFFF",
                      backgroundImage:
                        "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                      borderColor: selectedLayer.bgColor === null ? "#000000" : "rgba(0,0,0,0.3)",
                      borderWidth: selectedLayer.bgColor === null ? 2 : 1,
                    }}
                    title="No backing"
                  />
                  {["#FFFFFF", "#EFE3C4", "#FFF4E6", "#000000"].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateLayer(selectedLayer.id, { bgColor: c })}
                      className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: selectedLayer.bgColor === c ? "#DE4B33" : "rgba(0,0,0,0.2)",
                        borderWidth: selectedLayer.bgColor === c ? 2 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* NEW: apply pattern to both sides */}
            {selectedLayer.type === "pattern" && (
              <button
                onClick={() => applyPatternToBothSides(selectedLayer)}
                className="text-[11px] font-medium underline text-left"
                style={{ color: ACCENT }}
              >
                apply this pattern to both sides
              </button>
            )}

            <div className="flex justify-between pt-1">
              <button
                onClick={() => bringToFront(selectedLayer.id)}
                className="text-[11px] font-medium underline"
                style={{ color: ACCENT }}
              >
                bring to front
              </button>
              <button
                onClick={() => removeLayer(selectedLayer.id)}
                className="text-[11px] font-medium underline"
                style={{ color: "rgba(0,0,0,0.5)" }}
              >
                delete
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] mt-3 max-w-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
          Tap an item below to add it, then drag it into place on the {activeSide}.
        </p>
      </div>

      {/* ---------------- Asset palette (decorations removed) ---------------- */}
      <div className="px-6 md:px-12 py-8 max-w-2xl mx-auto">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
          Use your own pattern
        </p>
        <button
          onClick={() => patternFileInputRef.current?.click()}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-4 mb-8 text-left transition-colors"
          style={{ border: `1.5px dashed ${ACCENT}`, backgroundColor: "#EFE3C4" }}
        >
          <UploadIcon />
          <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
            Upload your own photo or pattern
            <br />
            <span className="text-[11px]">
              It'll be shaped to fit the fan automatically — drag, resize, and
              tint it once it's added.
            </span>
          </span>
        </button>
        <input
          ref={patternFileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handlePatternUpload}
        />

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
          Add text
        </p>
        <div className="flex gap-3 mb-10">
          <button
            onClick={() => addText("monogram")}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${ACCENT}`, color: ACCENT }}
          >
            + Monogram / Names
          </button>
          <button
            onClick={() => addText("message")}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${ACCENT}`, color: ACCENT }}
          >
            + Message
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
            style={{ backgroundColor: "#6E86C7", color: "#FFF4E6" }}
          >
            Preview my fan
            <span aria-hidden>→</span>
          </button>
          <span className="text-lg font-semibold" style={{ color: "#000000" }}>
            {PRICE} LE
          </span>
        </div>
      </div>

      {/* ---------------- Full-screen preview, both sides ---------------- */}
      {showPreview && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 px-6 py-10 overflow-y-auto"
          style={{ backgroundColor: "#FFF4E6" }}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-6 right-6 text-2xl transition-all duration-150 hover:scale-110 active:scale-90 hover:opacity-70"
            style={{ color: "#000000" }}
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex flex-col md:flex-row items-center gap-10">
            {(["front", "back"] as SideId[]).map((id) => (
              <div key={id} className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                  {id === "front" ? "Front" : "Back"}
                </p>
                <div className="relative w-full max-w-[240px] md:max-w-[280px]">
                  <img src={FAN_IMG} alt="" className="w-full h-auto" draggable={false} />
                  {layersBySide[id]
                    .slice()
                    .sort((a, b) => a.z - b.z)
                    .map((layer) => renderLayer(layer, false))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              // TODO: wire this up to your real cart store once it exists
              console.log("Fan order:", { front: layersBySide.front, back: layersBySide.back, price: PRICE });
            }}
            className="inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
            style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
          >
            Checkout — {PRICE} LE
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.6">
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <rect x="3" y="16" width="18" height="5" rx="1" />
    </svg>
  );
}