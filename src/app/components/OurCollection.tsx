"use client";

import Link from "next/link";
import { Caveat } from "next/font/google";
import AutoCenteredImage from "./AutoCenteredImage";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const CANDLES_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/collection/Coll%20candles.png";

const MOON_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/collection/giveaways%20coll.png";

export default function OurCollection() {
  return (
    <section
      className="relative w-full overflow-hidden py-16 md:py-24"
      style={{ backgroundColor: "#8FAA82" }}
    >
      {/* =====================================================
          SECTION EDGE WAVES
      ===================================================== */}

      <div className="absolute inset-x-0 top-0 z-30 -translate-y-[1px]">
        <svg
          viewBox="0 0 1440 60"
          className="h-[36px] w-full md:h-[56px]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,0 L1440,0 L1440,30 C1200,55 1080,5 840,30 C600,55 480,5 240,30 C120,42 60,36 0,30 Z"
            fill="#efe3c4"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 translate-y-[1px]">
        <svg
          viewBox="0 0 1440 60"
          className="h-[36px] w-full md:h-[56px]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,60 L1440,60 L1440,30 C1200,5 1080,55 840,30 C600,5 480,55 240,30 C120,18 60,24 0,30 Z"
            fill="#efe3c4"
          />
        </svg>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="relative z-20 mx-auto max-w-5xl px-6 text-center">
        <h2
          className="text-5xl font-normal tracking-tight md:text-[76px]"
          style={{
            color: "white",
            fontFamily: "Georgia, serif",
            lineHeight: "0.95",
          }}
        >
          Our Collection
        </h2>
      </div>

      {/* =====================================================
          CURVED RIBBON — THICKER FLOWING FABRIC SASH
      ===================================================== */}

      <div className="relative left-1/2 z-700 mt-1 w-screen -translate-x-1/2 md:mt-14">
        <svg
          viewBox="0 0 1600 230"
          className="h-auto w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="ribbon-shadow"
              x="-20%"
              y="-30%"
              width="140%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="4"
                floodColor="#8d8178"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          {/* =================================================
              THICKER RIBBON
          ================================================= */}

          <path
            d="
              M -20,35

              C 130,-10
                270,-10
                410,50

              C 535,115
                650,155
                775,105

              C 910,50
                1025,50
                1150,105

              C 1290,165
                1425,160
                1620,45

              L 1620,185

              C 1430,250
                1285,245
                1140,190

              C 1015,135
                905,135
                785,190

              C 650,245
                525,205
                400,145

              C 270,85
                130,90
                -20,160

              Z
            "
            fill="#efe3c4"
            filter="url(#ribbon-shadow)"
          />

          {/* =================================================
              TEXT CENTERLINE
          ================================================= */}

          <path
            id="ribbon-text-path"
            d="
              M -10,98

              C 130,43
                270,43
                405,100

              C 535,163
                650,198
                780,150

              C 910,96
                1025,96
                1145,150

              C 1290,208
                1435,203
                1610,100
            "
            fill="none"
          />

          <text
            style={{
              fill: "#000000",
              fontSize: "30px",
              fontWeight: 500,
              letterSpacing: "9px",
            }}
          >
            <textPath
              href="#ribbon-text-path"
              startOffset="50%"
              textAnchor="middle"
            >
              SCENTED ✦ HANDMADE ✦ GIFTED WITH LOVE ✦ MADE BY MOON
            </textPath>
          </text>
        </svg>
      </div>

      {/* =====================================================
          COLLECTION CARDS
      ===================================================== */}

      <div className="relative z-20 mx-auto -mt-6 grid max-w-[1020px] grid-cols-2 gap-3 px-4 md:-mt-10 md:gap-7 md:px-6">
        <CollectionCard
          img={CANDLES_IMG}
          imgAlt="Shop our candles"
          eyebrow="Handmade candles"
          title="Candles"
          href="/shop?category=candles"
          ctaLabel="Shop Candles"
          accent="#D8A1AF"
          imgBg="linear-gradient(135deg, #FFF9F5 0%, #FDECEF 55%, #F9DDE4 100%)"
        />

        <CollectionCard
          img={MOON_IMG}
          imgAlt="Shop our giveaways"
          eyebrow="Made for moments"
          title="Giveaways"
          href="/shop?category=giveaways"
          ctaLabel="Shop Giveaways"
          accent="#6E86C7"
          imgBg="linear-gradient(135deg, #FFF9F5 0%, #F1F4FF 55%, #E3E9FA 100%)"
        />
      </div>
    </section>
  );
}

/* =========================================================
   COLLECTION CARD
========================================================= */

function CollectionCard({
  img,
  imgAlt,
  eyebrow,
  title,
  href,
  ctaLabel,
  accent,
  imgBg,
}: {
  img: string;
  imgAlt: string;
  eyebrow: string;
  title: string;
  href: string;
  ctaLabel: string;
  accent: string;
  imgBg: string;
}) {
  return (
    <Link
      href={href}
      className="
        group
        relative
        block
        overflow-hidden
        rounded-t-[400px]
        rounded-b-[30px]
        border-2
        p-[6px]
        transition-transform
        duration-300
        hover:-translate-y-2
        md:rounded-t-[500px]
        md:rounded-b-[38px]
        md:p-2
      "
      style={{
        backgroundColor: "#FFF4E6",
        borderColor: "#F6E9D9",
        boxShadow: "0 10px 30px rgba(50, 55, 45, 0.10)",
      }}
    >
      {/* Inner border */}

      <div
        className="
          relative
          overflow-hidden
          rounded-t-[400px]
          rounded-b-[24px]
          border
          md:rounded-t-[500px]
          md:rounded-b-[31px]
        "
        style={{
          borderColor: `${accent}90`,
          backgroundColor: "#FFF4E6",
        }}
      >
        {/* =================================================
            IMAGE
        ================================================= */}

        <div
          className="
            relative
            aspect-[1]
            w-full
            overflow-hidden
          "
          style={{
            background: imgBg,
          }}
        >
          <AutoCenteredImage
            src={img}
            alt={imgAlt}
            paddingRatio={0}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-[1.025]
            "
          />
        </div>

        {/* =================================================
            CARD CONTENT
        ================================================= */}

        <div
          className="
            flex
            flex-col
            items-center
            px-2
            pb-4
            pt-4
            text-center
            md:px-6
            md:pb-7
            md:pt-5
          "
        >
          <p
            className={`${caveat.className} mb-1 text-[15px] leading-tight md:mb-2 md:text-[25px]`}
            style={{
              color: accent,
            }}
          >
            {eyebrow}
          </p>

          <h3
            className="
              mb-3
              text-[24px]
              font-normal
              leading-none
              md:mb-6
              md:text-[46px]
            "
            style={{
              color: "#111111",
              fontFamily: "Georgia, serif",
            }}
          >
            {title}
          </h3>

          <span
            className="
              inline-flex
              min-h-[38px]
              w-full
              items-center
              justify-center
              gap-1.5
              whitespace-nowrap
              rounded-full
              px-3
              py-2
              text-[8px]
              font-medium
              uppercase
              tracking-[0.08em]
              transition-all
              duration-300
              group-hover:px-6
              md:min-h-[50px]
              md:px-9
              md:text-[13px]
            "
            style={{
              backgroundColor: accent,
              color: "#FFF4E6",
            }}
          >
            {ctaLabel}

            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   ARROW
========================================================= */

function ArrowIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}