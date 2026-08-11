"use client";

import { useRef, useEffect, useCallback } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useActiveCandle } from "./ActiveCandleContext";

const DEFAULT_CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section/hero%20candles.png";
  
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
  return null;
}