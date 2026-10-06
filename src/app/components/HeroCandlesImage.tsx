"use client";

import { useEffect, useRef } from "react";
import { useActiveCandle } from "./ActiveCandleContext";

export default function HeroCandlesImage({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const lastRef = useRef("");
  const { setHeroImageRect } = useActiveCandle();

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    function report() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = {
        left: Math.round(rect.left + window.scrollX),
        top: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      // Only update when something actually changed.
      const key = `${next.left}|${next.top}|${next.width}|${next.height}`;
      if (key === lastRef.current) return;
      lastRef.current = key;
      setHeroImageRect(next);
    }

    report();

    const ro = new ResizeObserver(report);
    ro.observe(el);
    window.addEventListener("resize", report);
    window.addEventListener("load", report);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
      window.removeEventListener("load", report);
    };
  }, [setHeroImageRect]);

  return <img ref={imgRef} src={src} alt="Moon Candles collection" className={className} />;
}