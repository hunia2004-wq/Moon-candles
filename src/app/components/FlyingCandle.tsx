"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
type Props = {
  src: string;
  alt?: string;
  zIndex?: number;
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function FlyingCandle({ src, alt = "", zIndex = 30 }: Props) {
    const flyRef = useRef<HTMLImageElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const fly = flyRef.current;
    if (!isHome || !fly) return;

   

    let raf = 0;
    let fromEl: HTMLElement | null = null;
    let toEl: HTMLElement | null = null;

    const update = () => {
      raf = 0;

           const visible = (selector: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
          (el) => el.getClientRects().length > 0
        ) ?? null;

      fromEl = visible("[data-fly-from]");
      toEl = visible("[data-fly-to]");
      if (!fromEl || !toEl) {
        fly.style.opacity = "0";
        return;
      }

      const s = window.scrollY;
      const a = fromEl.getBoundingClientRect();
      const b = toEl.getBoundingClientRect();

      const fromTop = a.top + s;
      const toTop = b.top + s;

      // Scroll distance at which the target is centered on screen.
      const end = Math.max(1, toTop - (window.innerHeight - b.height) / 2);
            const START = 30; // pixels of scrolling before the candle lifts off
      const p = clamp((s - START) / Math.max(1, end - START));

      const x = lerp(a.left, b.left, p);
      const y = lerp(fromTop, toTop, p) - s;
      const scale = lerp(1, b.width / a.width, p);

      fly.style.width = `${a.width}px`;
      fly.style.height = `${a.height}px`;
      fly.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

      // At the two ends the flier sits exactly on a real candle, so swap
      // between them without a visible jump.
            const landed = p >= 1;

      // Fades in over the first 60px of scroll, so nothing shows at the top.
      const appear = clamp(s / 60);
      fly.style.opacity = landed ? "0" : String(appear);

      // The banner slot never shows; the carousel candle shows once landed.
      fromEl.dataset.flyHidden = "1";
      if (landed) {
        delete toEl.dataset.flyHidden;
      } else {
        toEl.dataset.flyHidden = "1";
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      if (raf) cancelAnimationFrame(raf);
            if (fromEl) delete fromEl.dataset.flyHidden;
      if (toEl) delete toEl.dataset.flyHidden;
    };
   }, [isHome]);

  if (!isHome) return null;

  return (
    <img
      ref={flyRef}
      src={src}
      alt={alt}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 select-none object-contain"
      style={{ zIndex, opacity: 0, transformOrigin: "0 0", willChange: "transform" }}
    />
  );
}