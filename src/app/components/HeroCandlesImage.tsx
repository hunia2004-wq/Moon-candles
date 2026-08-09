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
  const { setHeroImageRect } = useActiveCandle();

  useEffect(() => {
    function report() {
      const el = imgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setHeroImageRect({
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      });
    }

    report();
    window.addEventListener("scroll", report, { passive: true });
    window.addEventListener("resize", report);
    return () => {
      window.removeEventListener("scroll", report);
      window.removeEventListener("resize", report);
    };
  }, [setHeroImageRect]);

  return <img ref={imgRef} src={src} alt="Moon Candles collection" className={className} />;
}
