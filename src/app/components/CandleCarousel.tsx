"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { CarouselCandle } from "@/lib/supabase/types";
import { useActiveCandle } from "./ActiveCandleContext";

const ANGLE_STEP = 25;

export default function CandleCarousel({
  candles,
}: {
  candles: CarouselCandle[];
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [radius, setRadius] = useState(420);

  const dragState = useRef({
    startX: 0,
    startOffset: 0,
    dragging: false,
    moved: false,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const { setActiveImage, setActiveItemRect } =
    useActiveCandle();

  useEffect(() => {
    setMounted(true);

    function updateRadius() {
      setRadius(window.innerWidth < 640 ? 160 : 420);
    }

    updateRadius();

    window.addEventListener("resize", updateRadius);

    return () =>
      window.removeEventListener("resize", updateRadius);
  }, []);

  const activeIndex = candles.length
    ? Math.round(offset + candles.length) % candles.length
    : 0;

  const active = candles[activeIndex];

  useEffect(() => {
    let rafId: number;

    function report() {
      if (activeRef.current && active) {
        const rect =
          activeRef.current.getBoundingClientRect();

        setActiveItemRect({
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        });

        setActiveImage(active.image ?? null);
      }

      rafId = requestAnimationFrame(report);
    }

    rafId = requestAnimationFrame(report);

    return () => cancelAnimationFrame(rafId);
  }, [
    activeIndex,
    active,
    setActiveImage,
    setActiveItemRect,
  ]);

  if (candles.length === 0) {
    return (
      <p style={{ color: "#A6C071" }}>
        No candles available yet.
      </p>
    );
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(
      e.pointerId
    );

    dragState.current = {
      startX: e.clientX,
      startOffset: offset,
      dragging: true,
      moved: false,
    };

    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current.dragging) return;

    const deltaX =
      e.clientX - dragState.current.startX;

    if (Math.abs(deltaX) > 5) {
      dragState.current.moved = true;
    }

    const deltaOffset = -deltaX / 150;

    setOffset(
      dragState.current.startOffset + deltaOffset
    );
  }

  function handlePointerUp(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture(
      e.pointerId
    );

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
    className="fixed left-0 top-0 z-[9999] w-screen overflow-hidden"
    style={{
      height: "100dvh",
      backgroundColor: "#efe3c4",
      overscrollBehavior: "none",
      touchAction: "none",
    }}
  >
    {/* CLOSE BUTTON */}
    <button
      type="button"
      onClick={() => setExpanded(false)}
      className="absolute right-5 top-5 z-[10000] flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform hover:scale-110"
      style={{
        color: "#000000",
      }}
      aria-label="Close"
    >
      ✕
    </button>

    {/* =====================================================
        ENTIRE EXPANDED LAYOUT
        EXACTLY FITS ONE SCREEN
    ====================================================== */}

    <div
      className="grid w-full items-center justify-items-center"
      style={{
        height: "100dvh",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        paddingTop: "18px",
        paddingBottom: "20px",
        paddingLeft: "20px",
        paddingRight: "20px",
        boxSizing: "border-box",
      }}
    >

      {/* =================================================
          1. NAME + SIZE
          VERY TOP
      ================================================= */}

      <div
        className="flex flex-col items-center justify-center text-center"
        style={{
          zIndex: 20,
        }}
      >
        <h2
          style={{
            color: "#000000",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(26px, 4vw, 42px)",
            lineHeight: "1",
            letterSpacing: "0.04em",
            margin: "80px 50px -85px",
          }}
        >
          {active.name}
        </h2>

        {active.size_ml && (
          <p
            style={{
              color: "#000000",
              opacity: 0.6,
              fontSize: "clamp(11px, 1.2vw, 14px)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "100px 0 0 0",
              lineHeight: "1",
            }}
          >
            {active.size_ml} ml
          </p>
        )}
      </div>

      {/* =================================================
          2. LARGE CANDLE
          CENTER OF SCREEN
      ================================================= */}

      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {active.image && (
          <img
            src={active.image}
            alt={`${active.name} - ${active.colorName}`}
            draggable={false}
            style={{
              display: "block",
              width: "min(72vw, 600px)",
              height: "min(58dvh, 600px)",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
             animation:
  "candleFloat 3.2s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* =================================================
          3. COLOR SELECTOR
          4. PRICE
          5. BUTTON

          ALL DIRECTLY UNDER CANDLE
      ================================================= */}

      <div
        className="flex flex-col items-center justify-center"
        style={{
          zIndex: 20,
        }}
      >

        {/* COLOR SELECTOR */}

        <div
          className="flex items-center justify-center gap-2"
          style={{
            maxWidth: "90vw",
          }}
        >
          {candles.map((candle, index) => (
            <button
              key={`${candle.colorName}-${index}`}
              type="button"
              onClick={() => setOffset(index)}
              title={candle.colorName}
              className="overflow-hidden rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
              style={{
                width: "38px",
                height: "38px",
                flexShrink: 0,
                borderColor:
                  index === activeIndex
                    ? "#000000"
                    : "transparent",
                backgroundColor: "#ffffff",
                padding: 0,
              }}
            >
              {candle.image && (
                <img
                  src={candle.image}
                  alt={candle.colorName}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* PRICE */}

        <p
          style={{
            color: "#000000",
            fontWeight: 600,
            fontSize: "clamp(18px, 2vw, 24px)",
            lineHeight: "1",
            margin: "50px 0 0 0",
          }}
        >
          {active.price} EGP
        </p>

        {/* BUTTON */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/product/${active.productId}?color=${encodeURIComponent(
                active.colorName
              )}`
            )
          }
          className="transition-transform hover:scale-105 active:scale-95"
          style={{
            backgroundColor: "#47684b",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 500,
            padding: "9px 20px",
            marginTop: "10px",
            borderRadius: "5px",
            border: "none",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          View Product
        </button>
      </div>
    </div>

    {/* CANDLE ANIMATION */}

    <style jsx>{`
  @keyframes candleFloat {
    0% {
      transform: translateY(0px) rotate(0deg);
    }

    20% {
      transform: translateY(-4px) rotate(-0.4deg);
    }

    40% {
      transform: translateY(-9px) rotate(0.3deg);
    }

    60% {
      transform: translateY(-11px) rotate(0.5deg);
    }

    80% {
      transform: translateY(-5px) rotate(-0.3deg);
    }

    100% {
      transform: translateY(0px) rotate(0deg);
    }
  }
`}</style>
  </div>
);

  return (
    <div className="flex flex-col items-center gap-4 py-0">
      {/* ================= NORMAL CAROUSEL ================= */}

      <div
        ref={wrapperRef}
        className="relative h-[300px] w-full max-w-4xl md:h-[420px]"
        style={{
          perspective: "1000px",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {candles.map((candle, index) => {
          let relative = index - offset;

          if (relative > candles.length / 2) {
            relative -= candles.length;
          }

          if (relative < -candles.length / 2) {
            relative += candles.length;
          }

          const angle = relative * ANGLE_STEP;

          const radians =
            (angle * Math.PI) / 180;

          const x =
            Math.sin(radians) * radius;

          const isActive =
            index === activeIndex;

          const baseScale =
            1 -
            Math.min(
              Math.abs(relative) * 0.15,
              0.5
            );

          const scale =
            isActive && expanded
              ? baseScale * 1.2
              : baseScale;

          const opacity =
            1 -
            Math.min(
              Math.abs(relative) * 0.3,
              0.7
            );

          return (
            <div
              key={`${candle.colorName}-${index}`}
              ref={
                isActive
                  ? activeRef
                  : undefined
              }
              onClick={() =>
                handleCandleClick(index)
              }
              className="absolute left-1/2 top-1/2 h-64 w-44 cursor-pointer select-none rounded-lg md:h-96 md:w-64"
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) rotateY(${-angle}deg) scale(${scale})`,
                opacity,
                zIndex: isActive
                  ? 200
                  : 100 -
                    Math.round(
                      Math.abs(relative) * 10
                    ),
                transition: isDragging
                  ? "none"
                  : "transform 0.35s ease, opacity 0.35s ease",
              }}
            >
              {candle.image && (
                <img
                  src={candle.image}
                  alt={`${candle.name} ${candle.colorName}`}
                  draggable={false}
                  className="h-full w-full rounded-lg object-contain"
                />
              )}
            </div>
          );
        })}
      </div>

      {expanded &&
        mounted &&
        createPortal(
          overlay,
          document.body
        )}
    </div>
  );
}