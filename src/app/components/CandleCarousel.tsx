"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { CarouselCandle } from "@/lib/supabase/types";

const ANGLE_STEP = 25;

export default function CandleCarousel({ candles }: { candles: CarouselCandle[] }) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [radius, setRadius] = useState(420);
  const dragState = useRef({ startX: 0, startOffset: 0, dragging: false, moved: false });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    function updateRadius() {
      setRadius(window.innerWidth < 640 ? 160 : 420);
    }
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  if (candles.length === 0) {
    return <p style={{ color: "#A6C071" }}>No candles available yet.</p>;
  }

  const activeIndex = Math.round(offset + candles.length) % candles.length;
  const active = candles[activeIndex];

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startOffset: offset, dragging: true, moved: false };
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current.dragging) return;
    const deltaX = e.clientX - dragState.current.startX;
    if (Math.abs(deltaX) > 5) dragState.current.moved = true;
    const deltaOffset = -deltaX / 150;
    setOffset(dragState.current.startOffset + deltaOffset);
  }

  function handlePointerUp(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragState.current.dragging = false;
    setIsDragging(false);
    setOffset(Math.round(offset));
  }

  function handleCandleClick(index: number) {
    if (dragState.current.moved) return;

    if (index === activeIndex) {
      setExpanded((prev) => !prev);
    } else {
      setOffset(index);
      setExpanded(false);
    }
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto"
      style={{ backgroundColor: "#556B2F" }}
    >
      <button
        onClick={() => setExpanded(false)}
        className="fixed top-6 right-6 text-2xl text-white z-20"
        aria-label="Close"
      >
        ✕
      </button>

      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col-reverse items-center gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between md:gap-8 md:px-16">
        <div className="z-10 w-full max-w-md text-white md:w-1/2">
          <h3 className="text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
            {active.name}
          </h3>
          <p className="mt-1 text-sm uppercase tracking-wide text-white/60">
            {active.colorName}
          </p>

          {active.size_ml && (
            <p className="mt-2 text-xs uppercase tracking-wide text-white/50">
              {active.size_ml} ml
            </p>
          )}

          {active.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {active.description}
            </p>
          )}

          {active.scents?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-white/50">
                Available scents
              </p>
              <div className="max-h-40 overflow-y-auto pr-2">
                <p className="text-sm leading-relaxed text-white/80">
                  {active.scents.join(" · ")}
                </p>
              </div>
            </div>
          )}

          <p className="mt-6 text-2xl font-semibold">{active.price} EGP</p>

          <button
            onClick={() => router.push(`/product/${active.productId}?color=${encodeURIComponent(active.colorName)}`)}
            className="mt-8 rounded-full px-8 py-3 font-medium"
            style={{ backgroundColor: "#FF5A36", color: "#FFFFFF" }}
          >
            View Product
          </button>
        </div>

        <div className="relative flex w-full items-center justify-center md:w-1/2">
          <div
            className="absolute h-[380px] w-[380px] rounded-full opacity-40 blur-3xl md:h-[500px] md:w-[500px]"
            style={{ background: "radial-gradient(circle, #FF5A36, transparent 70%)" }}
          />
          {active.image && (
            <img
              src={active.image}
              alt={`${active.name} - ${active.colorName}`}
              draggable={false}
              className="relative h-[300px] object-contain md:h-[70vh]"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 py-0">
      <div
        className="relative h-[300px] w-full max-w-4xl md:h-[420px]"
        style={{ perspective: "1000px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {candles.map((candle, index) => {
          let relative = index - offset;
          if (relative > candles.length / 2) relative -= candles.length;
          if (relative < -candles.length / 2) relative += candles.length;

          const angle = relative * ANGLE_STEP;
          const radians = (angle * Math.PI) / 180;
          const x = Math.sin(radians) * radius;
          const isActive = index === activeIndex;
          const baseScale = 1 - Math.min(Math.abs(relative) * 0.15, 0.5);
          const scale = isActive && expanded ? baseScale * 1.2 : baseScale;
          const opacity = 1 - Math.min(Math.abs(relative) * 0.3, 0.7);

          return (
            <div
              key={candle.colorName}
              onClick={() => handleCandleClick(index)}
              className="absolute left-1/2 top-1/2 h-64 w-44 cursor-pointer select-none rounded-lg md:h-96 md:w-64"
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) rotateY(${-angle}deg) scale(${scale})`,
                opacity,
                zIndex: isActive ? 200 : 100 - Math.round(Math.abs(relative) * 10),
              }}
            >
              {candle.image && (
                <img
                  src={candle.image}
                  alt={`${candle.name} - ${candle.colorName}`}
                  draggable={false}
                  className="h-full w-full object-contain rounded-lg"
                />
              )}
            </div>
          );
        })}
      </div>

      {!expanded && (
        <h3 className="text-xl font-semibold" style={{ color: "#556B2F" }}>
          {active.name} — {active.colorName}
        </h3>
      )}

      {expanded && mounted && createPortal(overlay, document.body)}
    </div>
  );
}
