"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/melt%20balm%202.png";
const LIGHTER_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/lighter.png";
const HAND_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hand%20with%20wax.png";

/**
 * A single wax drip that falls from the candle base to the hand as
 * scrollYProgress moves through [start, end]. Three of these, staggered,
 * create the "dripping" effect.
 */
function WaxDrip({
  scrollYProgress,
  start,
  end,
  travel,
  x,
  size = 9,
}: {
  scrollYProgress: MotionValue<number>;
  start: number;
  end: number;
  travel: number;
  x: number;
  size?: number;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.03, end - 0.05, end],
    [0, 1, 1, 0.9]
  );
  const y = useTransform(scrollYProgress, [start, end], [0, travel]);
  const scaleY = useTransform(
    scrollYProgress,
    [start, start + 0.06, end],
    [0.4, 1, 1.3]
  );

  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        y,
        opacity,
        scaleY,
        width: size,
        height: size * 1.7,
        borderRadius: "50% 50% 45% 45% / 60% 60% 40% 40%",
        background: "linear-gradient(180deg, #F6E2B4 0%, #E8B76B 100%)",
        boxShadow: "0 2px 5px rgba(180,120,40,0.25)",
      }}
    />
  );
}

export default function MeltballSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // --- Stage 1 (0 -> ~0.32): lighter swings in toward the wick, then lifts away
  const lighterOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.3, 0.38],
    [0, 1, 1, 0]
  );
  const lighterX = useTransform(scrollYProgress, [0, 0.16], [70, 0]);
  const lighterY = useTransform(scrollYProgress, [0, 0.16], [-50, 0]);
  const lighterRotate = useTransform(
    scrollYProgress,
    [0, 0.16, 0.38],
    [12, -6, -12]
  );

  // --- Stage 2 (0.1 -> 0.3): ignition glow blooms at the wick
  const glowOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.32],
    [0, 1, 0.5]
  );
  const glowScale = useTransform(scrollYProgress, [0.1, 0.26], [0.4, 1.3]);

  // --- Stage 2b: candle "catches" — dim/desaturated to fully lit
  const candleFilter = useTransform(
    scrollYProgress,
    [0.05, 0.26],
    ["grayscale(0.65) brightness(0.75)", "grayscale(0) brightness(1)"]
  );
  const candleScale = useTransform(scrollYProgress, [0.05, 0.26], [0.97, 1]);

  // --- Stage 3 (0.35 -> 0.8): wax drips fall (see WaxDrip components below)

  // --- Stage 4 (0.55 -> 0.78): hand rises/fades in underneath
  const handOpacity = useTransform(scrollYProgress, [0.55, 0.74], [0, 1]);
  const handY = useTransform(scrollYProgress, [0.55, 0.78], [36, 0]);

  return (
    <section ref={sectionRef} className="relative w-full" style={{ height: "350vh" }}>
      <div
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#FFF4E6" }}
      >
        <div className="text-center mb-6 px-6">
          <p
            className="uppercase tracking-[0.2em] text-xs md:text-sm"
            style={{ color: "#DE4B33" }}
          >
            introducing
          </p>
          <h2
            className="font-serif text-3xl md:text-5xl mt-2"
            style={{ color: "#35241C" }}
          >
            The Meltball Candle
          </h2>
        </div>

        <div className="relative" style={{ width: 360, height: 520 }}>
          {/* ignition glow, sits behind the candle/wick */}
          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              top: 55,
              width: 90,
              height: 90,
              marginLeft: -45,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,150,70,0.55) 0%, rgba(255,150,70,0) 70%)",
              opacity: glowOpacity,
              scale: glowScale,
              filter: "blur(4px)",
              zIndex: 1,
            }}
          />

          {/* candle */}
          <motion.img
            src={CANDLE_IMG}
            alt="Meltball candle"
            style={{
              position: "absolute",
              left: "50%",
              top: 35,
              width: 220,
              marginLeft: -110,
              filter: candleFilter,
              scale: candleScale,
              zIndex: 2,
            }}
          />

          {/* lighter, enters from upper right toward the wick */}
          <motion.img
            src={LIGHTER_IMG}
            alt="Lighter"
            style={{
              position: "absolute",
              left: "56%",
              top: -20,
              width: 150,
              x: lighterX,
              y: lighterY,
              rotate: lighterRotate,
              opacity: lighterOpacity,
              transformOrigin: "top left",
              zIndex: 3,
            }}
          />

          {/* wax drips, staggered, falling from candle base toward the hand */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 235,
              width: 0,
              height: 230,
              zIndex: 2,
            }}
          >
            <WaxDrip scrollYProgress={scrollYProgress} start={0.38} end={0.68} travel={215} x={-8} size={9} />
            <WaxDrip scrollYProgress={scrollYProgress} start={0.47} end={0.76} travel={210} x={4} size={7} />
            <WaxDrip scrollYProgress={scrollYProgress} start={0.42} end={0.72} travel={220} x={-1} size={8} />
          </div>

          {/* hand, waiting below to catch the wax */}
          <motion.img
            src={HAND_IMG}
            alt="Hand catching melted wax"
            style={{
              position: "absolute",
              left: "50%",
              bottom: -10,
              width: 260,
              marginLeft: -130,
              opacity: handOpacity,
              y: handY,
              zIndex: 1,
            }}
          />
        </div>

        <p
          className="text-xs md:text-sm mt-4 tracking-wide"
          style={{ color: "#7A4A35" }}
        >
          scroll to watch it melt
        </p>
      </div>
    </section>
  );
}