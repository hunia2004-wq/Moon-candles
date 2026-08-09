"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

// The hero is designed once at this fixed pixel size, then scaled as a
// single rigid unit to fit whatever screen it's on. Nothing inside ever
// needs separate mobile/desktop values again — this guarantees the exact
// same proportions everywhere, no drifting between elements.
const BASE_WIDTH = 400;
const BASE_HEIGHT = 620;

export default function ScaledHero({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const el = outerRef.current;
      if (!el) return;
      setScale(el.offsetWidth / BASE_WIDTH);
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (outerRef.current) observer.observe(outerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="relative w-full"
      style={{ height: BASE_HEIGHT * scale }}
    >
      <div
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
