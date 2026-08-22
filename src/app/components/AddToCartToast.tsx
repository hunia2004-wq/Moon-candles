 // src/app/components/AddToCartToast.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getCart, cartCount } from "@/lib/cart";

const ACCENT = "#DE4B33";

export default function AddToCartToast() {
  const [visible, setVisible] = useState(false);
  const lastCount = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Establish the baseline once on mount, without showing a toast for it.
    lastCount.current = cartCount(getCart());

    function handleCartUpdated() {
      const newCount = cartCount(getCart());
      if (lastCount.current !== null && newCount > lastCount.current) {
        setVisible(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setVisible(false), 2200);
      }
      lastCount.current = newCount;
    }

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(-50%, 0)"
          : "translate(-50%, 12px)",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg"
        style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
      >
        <span aria-hidden>✓</span> Added to cart
      </div>
    </div>
  );
}