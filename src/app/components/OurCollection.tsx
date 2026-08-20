"use client";

import Link from "next/link";
import { Caveat } from "next/font/google";
import AutoCenteredImage from "./AutoCenteredImage";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

const CANDLES_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/collection/Coll%20candles.png";

const MOON_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/collection/Coll%20giveaways.png";

export default function OurCollection() {
  return (
    <section className="w-full py-16 md:py-24" style={{ backgroundColor: "#FFF4E6" }}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "#6E86C7" }}
        >
          Explore
        </p>
        <h2
          className="mb-12 text-3xl font-bold md:mb-16 md:text-5xl"
          style={{ color: "#000000" }}
        >
          Our Collection
        </h2>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 px-4 md:gap-8 md:px-6">
        <CollectionCard
          img={CANDLES_IMG}
          imgAlt="Shop our candles"
          eyebrow="for the everyday ritual"
          title="Candles"
          href="/shop"
          ctaLabel="Shop Candles"
          accent="#D8A1AF"
        />
        <CollectionCard
          img={MOON_IMG}
          imgAlt="Shop our giveaways"
          eyebrow="for gifting joy"
          title="Giveaways"
          href="/shop?category=giveaways"
          ctaLabel="Shop Giveaways"
          accent="#6E86C7"
        />
      </div>
    </section>
  );
}

function CollectionCard({
  img,
  imgAlt,
  eyebrow,
  title,
  href,
  ctaLabel,
  accent,
}: {
  img: string;
  imgAlt: string;
  eyebrow: string;
  title: string;
  href: string;
  ctaLabel: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center pt-2 pb-4 px-3 text-center transition-transform duration-300 hover:-translate-y-1 md:pt-4 md:pb-6 md:px-6"
    >
      {/* Photo badge with a moon-phase "bite" — a second circle, matching
          the card's own accent, overlapping the top-right edge of the
          white circle. Purely decorative, doesn't touch the photo. */}
      <div className="relative mb-4 h-24 w-24 md:mb-6 md:h-44 md:w-44">
        <div
          className="absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
        >
          <AutoCenteredImage
            src={img}
            alt={imgAlt}
            paddingRatio={0.08}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        {/* the "bite" */}
        <span
          className="absolute rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{
            top: "-4%",
            right: "-8%",
            width: "34%",
            height: "34%",
            backgroundColor: accent,
          }}
          aria-hidden
        />
      </div>

      <p
        className={`${caveat.className} mb-2 text-base leading-tight md:mb-3 md:text-2xl`}
        style={{ color: accent }}
      >
        {eyebrow}
      </p>

      <h3 className="mb-4 text-lg font-bold md:mb-6 md:text-3xl" style={{ color: "#000000" }}>
        {title}
      </h3>

      <span
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all duration-300 group-hover:gap-2 md:gap-1.5 md:px-5 md:py-2 md:text-xs"
        style={{ backgroundColor: accent, color: "#FFF4E6" }}
      >
        {ctaLabel}
        <ArrowIcon />
      </span>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}