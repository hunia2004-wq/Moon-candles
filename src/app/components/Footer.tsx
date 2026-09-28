"use client";

import Link from "next/link";

// Same page background used across the site (see OurCollection's PAGE_BG,
// the home page's outer div, etc.) — the footer now blends into the page
// instead of being its own colored block.
const PAGE_BG = "#efe3c4";
const LINE_GREEN = "#000000"; // the stripe green used elsewhere on the site
const ICON_COLOR = "#000000"; // deep green, matches other text/buttons
const ICON_HOVER = "#000000"; // darker shade of the same green — not the accent

const LOGO_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/moon%20logo/logo.png";

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
          className="absolute left-1/2 flex h-12 -translate-x-1/2 items-center justify-center overflow-hidden select-none"
        >
          <img
            src={LOGO_IMG}
            alt="Moon Candles"
            className="h-35 w-auto max-w-none shrink-0 md:h-11"
          />
        </Link>

        {/* Icons — uniform size, no badge/background, colored to match the
            rest of the site's text/button green rather than the accent. */}
        <div className="flex items-center gap-4">
          {SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-5 w-5 items-center justify-center transition-all duration-200 hover:scale-110"
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

// All three set to an identical 20x20 viewBox / stroke weight so they read
// as the same visual size regardless of how different each glyph's shape
// naturally is (TikTok's mark is thinner than Instagram's square, etc.)
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c2.7 0 3.05.01 4.12.06 1.07.05 1.79.22 2.43.46.66.25 1.22.6 1.77 1.15.5.5.9 1.11 1.15 1.77.24.64.41 1.36.46 2.43.05 1.07.06 1.42.06 4.12s-.01 3.05-.06 4.12c-.05 1.07-.22 1.79-.46 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.24-1.36.41-2.43.46-1.07.05-1.42.06-4.12.06s-3.05-.01-4.12-.06c-1.07-.05-1.79-.22-2.43-.46a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.24-.64-.41-1.36-.46-2.43C2.01 15.05 2 14.7 2 12s.01-3.05.06-4.12c.05-1.07.22-1.79.46-2.43.25-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.44 2.53c.64-.24 1.36-.41 2.43-.46C8.95 2.01 9.3 2 12 2Zm0 1.8c-2.65 0-2.97.01-4.02.06-.87.04-1.34.18-1.65.3-.42.16-.72.35-1.03.66-.31.31-.5.61-.66 1.03-.12.31-.26.78-.3 1.65C4.29 8.65 4.28 8.97 4.28 12s.01 2.97.06 4.02c.04.87.18 1.34.3 1.65.16.42.35.72.66 1.03.31.31.61.5 1.03.66.31.12.78.26 1.65.3 1.05.05 1.37.06 4.02.06s2.97-.01 4.02-.06c.87-.04 1.34-.18 1.65-.3.42-.16.72-.35 1.03-.66.31-.31.5-.61.66-1.03.12-.31.26-.78.3-1.65.05-1.05.06-1.37.06-4.02s-.01-2.97-.06-4.02c-.04-.87-.18-1.34-.3-1.65a2.76 2.76 0 0 0-.66-1.03 2.76 2.76 0 0 0-1.03-.66c-.31-.12-.78-.26-1.65-.3C14.97 3.81 14.65 3.8 12 3.8Zm0 3.05a5.15 5.15 0 1 1 0 10.3 5.15 5.15 0 0 1 0-10.3Zm0 1.8a3.35 3.35 0 1 0 0 6.7 3.35 3.35 0 0 0 0-6.7Zm5.34-1.98a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
    </svg>
  );
}