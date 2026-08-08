"use client";

import { useRef, useEffect, useCallback } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useActiveCandle } from "./ActiveCandleContext";

const DEFAULT_CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/purple%20and%20yellow%20marble.png";
  
  const MERGE_START = 0.32;
const MERGE_END = 0.42;

const DRIFT_WAYPOINTS = [
  { p: 0, leftFrac: 0.74, topFrac: 0.588 },
  { p: MERGE_START, leftFrac: 0.68, topFrac: 0.95 },
];



function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getDriftPosition(p: number) {
  for (let i = 0; i < DRIFT_WAYPOINTS.length - 1; i++) {
    const a = DRIFT_WAYPOINTS[i];
    const b = DRIFT_WAYPOINTS[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / (b.p - a.p || 1);
      return {
        leftFrac: lerp(a.leftFrac, b.leftFrac, t),
        topFrac: lerp(a.topFrac, b.topFrac, t),
      };
    }
  }
  const last = DRIFT_WAYPOINTS[DRIFT_WAYPOINTS.length - 1];
  return { leftFrac: last.leftFrac, topFrac: last.topFrac };
}

export default function FloatingMoon() {
  const { scrollYProgress } = useScroll();
  const { activeImage, activeItemRect, setFloatingCrossfade } = useActiveCandle();
  const elRef = useRef<HTMLDivElement>(null);
  const hasMergedRef = useRef(false);
  
const update = useCallback(
  (latest: number) => {
    const el = elRef.current;
    if (!el) return;
    const appearOpacity = Math.min(1, latest / 0.02);
el.style.opacity = String(appearOpacity);

    // Once fully merged, lock to the carousel item's real document
    // position and stop recalculating — no more scroll-math lag.
    if (hasMergedRef.current && activeItemRect) {
      const docLeft = activeItemRect.left + activeItemRect.width / 2;
      const docTop = activeItemRect.top + activeItemRect.height / 2;
      el.style.position = "absolute";
      el.style.left = `${docLeft}px`;
      el.style.top = `${docTop}px`;
      el.style.width = `${activeItemRect.width}px`;
      el.style.height = `${activeItemRect.height}px`;
      el.style.transform = `translate(-50%, -50%)`;

      const defaultImg = el.querySelector<HTMLImageElement>('[data-img="default"]');
      const activeImg = el.querySelector<HTMLImageElement>('[data-img="active"]');
      if (defaultImg) defaultImg.style.opacity = "0";
      if (activeImg) activeImg.style.opacity = "1";
      setFloatingCrossfade(1);
      return;
    }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      const smallSize = isMobile ? 140 : 255;

      const drift = getDriftPosition(Math.min(latest, MERGE_START));
      const driftLeft = drift.leftFrac * vw;
      const driftTop = drift.topFrac * vh;

      const rawT = Math.min(1, Math.max(0, (latest - MERGE_START) / (MERGE_END - MERGE_START)));
      if (rawT >= 1) hasMergedRef.current = true;
      const t = hasMergedRef.current ? 1 : rawT;
      setFloatingCrossfade(t);

      let targetViewportLeft = driftLeft;
      let targetViewportTop = driftTop;
      let width = smallSize;
      let height = smallSize;

      if (activeItemRect) {
        const targetDocLeft = activeItemRect.left + activeItemRect.width / 2;
        const targetDocTop = activeItemRect.top + activeItemRect.height / 2;
        const targetViewportLeftFull = targetDocLeft - window.scrollX;
        const targetViewportTopFull = targetDocTop - window.scrollY;
        targetViewportLeft = lerp(driftLeft, targetViewportLeftFull, t);
        targetViewportTop = lerp(driftTop, targetViewportTopFull, t);
        width = lerp(smallSize, activeItemRect.width, t);
        height = lerp(smallSize, activeItemRect.height, t);
      }

      el.style.left = `${targetViewportLeft}px`;
      el.style.top = `${targetViewportTop}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.transform = `translate(-50%, -50%)`;

      const defaultImg = el.querySelector<HTMLImageElement>('[data-img="default"]');
      const activeImg = el.querySelector<HTMLImageElement>('[data-img="active"]');
      if (defaultImg) defaultImg.style.opacity = String(1 - t);
      if (activeImg) activeImg.style.opacity = String(t);
    },
    [activeItemRect, setFloatingCrossfade]
  );

  // Run on every scroll change (existing behavior)
  useMotionValueEvent(scrollYProgress, "change", update);

  // ALSO run once immediately on mount/refresh, using whatever the current
  // scroll value already is — this fixes the "stuck in wrong spot on
  // refresh" bug, since scroll "change" events don't fire just from loading.
  useEffect(() => {
    update(scrollYProgress.get());
  }, [update, scrollYProgress]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none z-40"
      style={{ position: "fixed", left: "8%", top: "10%" }}
    >
      <img
        data-img="default"
        src={DEFAULT_CANDLE_IMG}
        alt=""
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-75"
      />
      <img
        data-img="active"
        src={activeImage ?? DEFAULT_CANDLE_IMG}
        alt=""
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-75"
        style={{ opacity: 0 }}
      />
    </div>
  );
}