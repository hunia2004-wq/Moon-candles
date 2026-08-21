"use client";

import Link from "next/link";

const CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/customization%201.jpg";
const GIVEAWAY_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/customization%202.png";

/**
 * Homepage teaser for both customization paths, styled as a pair of
 * "ticket stub" cards — photo on top, a torn perforation line, details
 * below, with a rotated corner tag. A deliberately different shape from
 * the arch-panel motif used elsewhere on the site.
 */
export default function CustomizationTeaser() {
  return (
    <section
      className="w-full flex justify-center px-4 py-16 md:py-24"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <div className="w-full" style={{ maxWidth: 1000 }}>
        <div className="text-center mb-10 md:mb-14">
          <p
            className="uppercase tracking-[0.3em] text-xs md:text-sm mb-2"
            style={{ color: "#000000", opacity: 0.5 }}
          >
            Two ways to make it yours
          </p>
          <h2 className="text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customize
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <TicketCard
            accent="#DE4B33"
            accentDark="#DE4B33"
            tag="Candles"
            img={CANDLE_IMG}
            imgAlt="A customized candle with a photo and message"
            headline="Light up a memory"
            description="Add a photo, write a message, pick your scent, a candle made entirely by you."
            href="/customize"
            ctaLabel="Customize your candle"
          />
                    <TicketCard
            accent="#DE4B33"
            accentDark="#DE4B33"
            tag="Giveaways"
            img={GIVEAWAY_IMG}
            imgAlt="A customized giveaway with a handwritten note"
            headline="A little something extra"
            description="Small treats, big meaning. Personalize a giveaway your guests will actually keep."
            href="/shop?category=giveaways"
            ctaLabel="Customize your giveaways"
            imgFit="contain"
            imgBg="#f1ddc1"
          />
        </div>
      </div>
    </section>
  );
}

function TicketCard({
  accent,
  accentDark,
  tag,
  img,
  imgAlt,
  headline,
  description,
  href,
  ctaLabel,
  imgFit = "cover",
  imgBg,
}: {
  accent: string;
  accentDark: string;
  tag: string;
  img: string;
  imgAlt: string;
  headline: string;
  description: string;
  href: string;
  ctaLabel: string;
  imgFit?: "cover" | "contain";
  imgBg?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-visible transition-transform duration-300 hover:-translate-y-1.5"
    >
      {/* Rotated corner tag, peeking out above the card */}
      <span
        className="absolute -top-4 left-6 z-10 rotate-[-6deg] rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-md transition-transform duration-300 group-hover:rotate-[-3deg]"
        style={{ backgroundColor: "#FFF4E6", color: accent, border: `1.5px solid ${accent}` }}
      >
        {tag}
      </span>

      <div
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{ backgroundColor: accent }}
      >
               {/* Photo half */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden"
          style={imgBg ? { backgroundColor: imgBg } : undefined}
        >
          <img
            src={img}
            style={{ transform: "scale(1.155)" }}
            alt={imgAlt}
            className={`h-full w-full transition-transform duration=500 group-hover:scale-105 ${
              imgFit === "contain" ? "object-contain" : "object-cover"
              
            }`}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)" }}
          />
        </div>

        {/* Perforation — the "tear here" line between photo and details,
            plus two notches cut into the card edges so it reads as a
            real ticket stub, not just a dashed rule. */}
        <div className="relative flex items-center px-2">
          <div
            className="absolute -left-3 h-6 w-6 rounded-full"
            style={{ backgroundColor: "#efe3c4" }}
          />
          <div
            className="my-2 flex-1 border-t-2 border-dashed"
            style={{ borderColor: "rgba(255,244,230,0.5)" }}
          />
          <div
            className="absolute -right-3 h-6 w-6 rounded-full"
            style={{ backgroundColor: "#efe3c4" }}
          />
        </div>

        {/* Details half */}
        <div className="px-6 pb-7 pt-3 text-left md:px-8 md:pb-8">
          <h3 className="mb-2 text-xl font-bold md:text-2xl" style={{ color: "#FFF4E6" }}>
            {headline}
          </h3>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "#FFF4E6", opacity: 0.85 }}>
            {description}
          </p>

          <span
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-300"
            style={{ backgroundColor: "#FFF4E6", color: accent }}
          >
            {ctaLabel}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}