"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase/types";

const RADIUS = 420;
const ANGLE_STEP = 25;

export default function CandleCarousel({ candles }: { candles: Product[] }) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dragState = useRef({ startX: 0, startOffset: 0, dragging: false, moved: false });
  const router = useRouter();

  if (candles.length === 0) {
    return <p className="text-zinc-500">No candles available yet.</p>;
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

  const coverImage = active.image_urls?.[0] ?? active.colors?.[0]?.image_url;

  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <div
        className="relative h-[600px] w-full max-w-4xl"
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
          const x = Math.sin(radians) * RADIUS;
          const isActive = index === activeIndex;
          const baseScale = 1 - Math.min(Math.abs(relative) * 0.15, 0.5);
          const scale = isActive && expanded ? baseScale * 1.2 : baseScale;
          const opacity = 1 - Math.min(Math.abs(relative) * 0.3, 0.7);
          const thumbnail = candle.image_urls?.[0] ?? candle.colors?.[0]?.image_url;

          return (
            <div
              key={candle.id}
              onClick={() => handleCandleClick(index)}
              className={`absolute left-1/2 top-1/2 h-96 w-64 cursor-pointer select-none rounded-lg bg-zinc-200 dark:bg-zinc-800 ${
                isDragging ? "" : "transition-transform duration-200"
              }`}
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) rotateY(${-angle}deg) scale(${scale})`,
                opacity,
                zIndex: isActive ? 200 : 100 - Math.round(Math.abs(relative) * 10),
              }}
            >
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt={candle.name}
                  draggable={false}
                  className="h-full w-full object-cover rounded-lg"
                />
              )}
            </div>
          );
        })}
      </div>

      {!expanded && <h3 className="text-xl font-semibold">{active.name}</h3>}

    {expanded && (
  <div
    className="fixed inset-0 z-[999] flex items-center"
    style={{ backgroundColor: "#5E3A4D" }}
  >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-6 right-6 text-2xl text-white z-10"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="relative z-10 max-w-sm px-16 text-white">
            <h3 className="text-4xl font-bold uppercase tracking-wide">{active.name}</h3>
            {active.size_ml && (
              <p className="mt-1 text-xs uppercase text-zinc-500">{active.size_ml} ml</p>
            )}
            <p className="mt-2 text-sm uppercase text-zinc-400">
              {active.scents?.join(" · ")}
            </p>

            {active.colors?.length > 0 && (
              <div className="mt-4 flex gap-2">
                {active.colors.map((color) => (
                  <span
                    key={color.name}
                    title={color.name}
                    className="h-6 w-6 rounded-full border border-white/30 overflow-hidden"
                    style={{ backgroundColor: color.hex ?? "#888" }}
                  />
                ))}
              </div>
            )}

            <p className="mt-6 text-2xl font-semibold">{active.price} EGP</p>
            <button
  onClick={() => router.push(`/product/${active.id}`)}
  className="mt-8 rounded-full px-8 py-3 font-medium"
  style={{ backgroundColor: "#F4E1D2", color: "#5E3A4D" }}
>
  View Product
</button>
          </div>

          <div className="absolute right-0 top-0 flex h-full w-2/3 items-center justify-center">
           <div
  className="absolute h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
  style={{ background: "radial-gradient(circle, #C77486, transparent 70%)" }}
/>
            {coverImage && (
              <img
                src={coverImage}
                alt={active.name}
                draggable={false}
                className="relative h-[80%] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}