"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/melt%20balm%202.png";
const LIGHTER_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/lighter.png";
const HAND_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hand.png";
const WAX_DRIP_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/wax%20dripping.png";

/** Reveals a REAL wax drip photo top-to-bottom using clip-path, so it looks
 * like it's actively dripping/growing, using genuine photo content. */
function WaxStream({
  scrollYProgress,
  start,
  end,
  x,
  width,
  rotate = 0,
}: {
  scrollYProgress: MotionValue<number>;
  start: number;
  end: number;
  x: number;
  width: number;
  rotate?: number;
}) {
  const revealPercent = useTransform(scrollYProgress, [start, end], [0, 100]);
  const clipPath = useTransform(revealPercent, (v) => `inset(0 0 ${100 - v}% 0)`);
  const opacity = useTransform(scrollYProgress, [start, start + 0.03], [0, 1]);

  return (
    <motion.img
      src={WAX_DRIP_IMG}
      alt=""
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width,
        rotate,
        clipPath,
        opacity,
      }}
    />
  );
}

function WaxPool({ scrollYProgress, start, end }: { scrollYProgress: MotionValue<number>; start: number; end: number }) {
  const scale = useTransform(scrollYProgress, [start, end], [0, 1]);
  const opacity = useTransform(scrollYProgress, [start, start + 0.04], [0, 1]);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 0,
        width: 46,
        height: 20,
        marginLeft: -23,
        scale,
        opacity,
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 40% 30%, #FCEFC9, #E8B76B 80%)",
        boxShadow: "0 1px 4px rgba(180,120,40,0.35)",
        transformOrigin: "center",
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

  const lighterOpacity = useTransform(scrollYProgress, [0, 0.06, 0.22, 0.3], [0, 1, 1, 0]);
  const lighterY = useTransform(scrollYProgress, [0, 0.2], [-40, 190]);

  const glowOpacity = useTransform(scrollYProgress, [0.16, 0.24, 0.34], [0, 1, 0.5]);
  const glowScale = useTransform(scrollYProgress, [0.16, 0.3], [0.4, 1.3]);

  const candleFilter = useTransform(
    scrollYProgress,
    [0.12, 0.3],
    ["grayscale(0.65) brightness(0.75)", "grayscale(0) brightness(1)"]
  );
  const groupRotate = useTransform(scrollYProgress, [0.22, 0.45], [0, -20]);

  const handOpacity = useTransform(scrollYProgress, [0.5, 0.68], [0, 1]);
  const handY = useTransform(scrollYProgress, [0.5, 0.72], [36, 0]);

  return (
    <section ref={sectionRef} className="relative w-full" style={{ height: "350vh" }}>
      <div
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#FFF4E6" }}
      >
        <div className="text-center mb-6 px-6">
          <p className="uppercase tracking-[0.2em] text-xs md:text-sm" style={{ color: "#DE4B33" }}>
            introducing
          </p>
          <h2 className="font-serif text-3xl md:text-5xl mt-2" style={{ color: "#35241C" }}>
            The Meltball Candle
          </h2>
        </div>

        <div className="relative" style={{ width: 360, height: 620 }}>
          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              top: 70,
              width: 220,
              marginLeft: -110,
              rotate: groupRotate,
              transformOrigin: "bottom center",
              zIndex: 2,
            }}
          >
            <motion.img
              src={CANDLE_IMG}
              alt="Meltball candle"
              style={{ width: "100%", display: "block", filter: candleFilter }}
            />

            <div style={{ position: "absolute", left: 45, top: 210, zIndex: 3 }}>
              <WaxStream scrollYProgress={scrollYProgress} start={0.1} end={0.9} x={0} width={40} />
            </div>
          </motion.div>

          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              top: 90,
              width: 70,
              height: 70,
              marginLeft: -35,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,150,70,0.55) 0%, rgba(255,150,70,0) 70%)",
              opacity: glowOpacity,
              scale: glowScale,
              filter: "blur(4px)",
              zIndex: 4,
            }}
          />

          <motion.img
            src={LIGHTER_IMG}
            alt="Lighter"
            style={{
              position: "absolute",
              left: "50%",
              top: -180,
              width: 130,
              marginLeft: -65,
              y: lighterY,
              opacity: lighterOpacity,
              zIndex: 5,
            }}
          />

          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -10,
              width: 260,
              marginLeft: -190,
              opacity: handOpacity,
              y: handY,
              zIndex: 1,
            }}
          >
            <img src={HAND_IMG} alt="Hand catching melted wax" style={{ width: "100%", display: "block" }} />
            <WaxPool scrollYProgress={scrollYProgress} start={0.62} end={0.78} />
          </motion.div>
        </div>

        <p className="text-xs md:text-sm mt-4 tracking-wide" style={{ color: "#7A4A35" }}>
          scroll to watch it melt
        </p>
      </div>
    </section>
  );
}