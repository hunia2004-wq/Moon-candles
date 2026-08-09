"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Rect = { left: number; top: number; width: number; height: number } | null;

type ActiveCandleContextValue = {
  activeImage: string | null;
  setActiveImage: (image: string | null) => void;
  // Exact on-screen rect of the specific active candle item (not the
  // whole carousel container) — this is what the floating candle should
  // land on for pixel-perfect alignment.
  activeItemRect: Rect;
  setActiveItemRect: (rect: Rect) => void;
  floatingCrossfade: number;
  setFloatingCrossfade: (value: number) => void;
};

const ActiveCandleContext = createContext<ActiveCandleContextValue | null>(null);

export function ActiveCandleProvider({ children }: { children: ReactNode }) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeItemRect, setActiveItemRect] = useState<Rect>(null);
  const [floatingCrossfade, setFloatingCrossfade] = useState(0);

  return (
    <ActiveCandleContext.Provider
      value={{
        activeImage,
        setActiveImage,
        activeItemRect,
        setActiveItemRect,
        floatingCrossfade,
        setFloatingCrossfade,
      }}
    >
      {children}
    </ActiveCandleContext.Provider>
  );
}

export function useActiveCandle() {
  const ctx = useContext(ActiveCandleContext);
  if (!ctx) {
    throw new Error("useActiveCandle must be used within ActiveCandleProvider");
  }
  return ctx;
}