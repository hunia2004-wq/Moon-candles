"use client";

import { LOGO_URL, LOGO_SIZE } from "@/lib/brand";
import Link from "next/link";

// Same page background used across the site (see OurCollection's PAGE_BG,
// the home page's outer div, etc.) — the footer now blends into the page
// instead of being its own colored block.
const PAGE_BG = "#efe3c4";
const LINE_GREEN = "#000000"; // the stripe green used elsewhere on the site
const ICON_COLOR = "#000000"; // deep green, matches other text/buttons
const ICON_HOVER = "#000000"; // darker shade of the same green — not the accent

const LOGO_IMG =
  LOGO_URL;

const SOCIALS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/the_moon_candlesshop?igsi=dHdsajd0djRqdXVv",
    icon: InstagramIcon,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/share/1DZQaYrnfd/?mibextid=wwXIfr",
    icon: FacebookIcon,
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@themooncandlesshop1?_r=1&_t=ZS-993PlWya8bV",
    icon: TikTokIcon,
  },
] as const;

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: PAGE_BG,
        borderTop: `1px solid ${LINE_GREEN}`,
        padding: "28px 6%",
      }}
    >
      <div className="relative mx-auto flex min-h-12 w-full max-w-4xl items-center justify-end">
        {/*
          The logo PNG has a lot of transparent padding, so the link is a
          fixed 48px box with overflow-hidden. That keeps the logo the same
          size but stops the invisible padding from growing the footer or
          covering (and stealing taps from) buttons above it.
        */}
        <Link
          href="/"
          aria-label="Moon Candles home"
          className={`absolute left-1/2 flex -translate-x-1/2 items-center justify-center overflow-hidden select-none ${LOGO_SIZE.footerBox}`}
        >
          <img
            src={LOGO_IMG}
            alt="Moon Candles"
            className={LOGO_SIZE.footerImg}
          />
        </Link>

        {/* Icons — uniform outline style, no badge/background. */}
        <div className="flex items-center gap-1 md:gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ color: ICON_COLOR }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ICON_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.color = ICON_COLOR)}
            >
              <s.icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// All three are outline icons with the same stroke weight, so they match.
function Outline({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-6 w-6 md:h-7 md:w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function InstagramIcon() {
  return (
    <Outline>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3" />
      <path d="M16.5 7.5v.01" />
    </Outline>
  );
}

function FacebookIcon() {
  return (
    <Outline>
      <path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2H7" />
    </Outline>
  );
}

function TikTokIcon() {
  return (
    <Outline>
      <path d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
    </Outline>
  );
}