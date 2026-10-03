import Link from "next/link";
import { Caveat } from "next/font/google";
import EmailButton from "../components/EmailButton";
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

export const metadata = {
  title: "Return Policy | Moon Candles",
};

const STRIPE_COUNT = 21;
const EMAIL = "Themooncandleshopp@gmail.com";
// TODO: replace with your real Instagram profile link
const INSTAGRAM_URL = "https://www.instagram.com/the_moon_candlesshop";

export default function ReturnPolicyPage() {
  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      {/* STRIPES */}
      <div className="relative h-10 w-full overflow-hidden md:h-14">
        <div className="absolute inset-0 flex">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: i % 2 === 0 ? "#8FAA82" : "#efe3c4" }}
            />
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header className="mx-auto w-full max-w-3xl px-6 pt-12 text-center md:pt-20">
        <p
          className={`${caveat.className} mb-1 text-2xl md:text-4xl`}
          style={{ color: "#657A55" }}
        >
          good to know
        </p>

        <h1
          className="text-5xl font-medium leading-none md:text-7xl"
          style={{
            color: "#000000",
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.035em",
          }}
        >
          Return Policy
        </h1>

        <span
          className="mt-6 block text-3xl leading-none"
          style={{ color: "#7A9567" }}
          aria-hidden="true"
        >
          ☾
        </span>
      </header>

      {/* POLICY CARDS */}
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-10 md:gap-7 md:px-6 md:py-14">
        <PolicyCard accent="#D8A1AF" icon="☾" title="Orders & refunds">
          <p>
            We do not offer refunds or exchanges once an order has been placed
            and delivered.
          </p>
        </PolicyCard>

        <PolicyCard accent="#DE4B33" icon="✦" title="Arrived damaged?">
          <p>
            If your order arrives damaged or broken due to handling by the
            shipping company, please contact us as soon as possible with clear
            photos of the damaged item and packaging. In such cases, we will
            review the issue and arrange a refund accordingly, or will resend
            the damaged product.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Photos of the item", "Photos of the packaging"].map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide md:text-xs"
                style={{ backgroundColor: "#efe3c4", color: "#657A55" }}
              >
                {label}
              </span>
            ))}
          </div>
        </PolicyCard>
      </main>

      {/* CONTACT SECTION */}
      <section
        className="relative w-full overflow-hidden py-20 md:py-28"
        style={{ backgroundColor: "#8FAA82" }}
      >
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

        <div className="relative z-20 mx-auto max-w-xl px-6 text-center">
          <p
            className={`${caveat.className} mb-1 text-2xl md:text-3xl`}
            style={{ color: "#FFF4E6" }}
          >
            we're here to help
          </p>

          <h2
            className="mb-4 text-4xl font-normal leading-tight md:text-5xl"
            style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
          >
            Any questions?
          </h2>

          <p
            className="mb-8 text-sm leading-relaxed md:text-base"
            style={{ color: "#FFF4E6" }}
          >
            For any other inquiries or concerns regarding your order, please
            contact us via email or send us a direct message on Instagram.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <EmailButton email={EMAIL} />

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-medium uppercase tracking-[0.08em] transition-transform duration-300 hover:-translate-y-1 sm:w-auto md:text-[13px]"
              style={{ backgroundColor: "#D8A1AF", color: "#FFF4E6" }}
            >
              <InstagramIcon />
              Message on Instagram
            </a>
          </div>

       
        </div>
      </section>

      {/* BACK TO SHOP */}
      <div className="w-full py-10 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-[5px] px-5 py-2.5 text-sm transition-colors bg-[#47684b] hover:bg-[#7C966F]"
          style={{ color: "#FFFFFF", textDecoration: "none" }}
        >
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

/* ---------- POLICY CARD ---------- */

function PolicyCard({
  accent,
  icon,
  title,
  children,
}: {
  accent: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[28px] border-2 p-[6px] md:p-2"
      style={{
        backgroundColor: "#FFF4E6",
        borderColor: "#F6E9D9",
        boxShadow: "0 10px 30px rgba(50, 55, 45, 0.10)",
      }}
    >
      <div
        className="rounded-[22px] border px-6 py-7 md:px-10 md:py-9"
        style={{ borderColor: `${accent}90`, backgroundColor: "#FFF4E6" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none"
            style={{ backgroundColor: accent, color: "#FFF4E6" }}
            aria-hidden="true"
          >
            {icon}
          </span>

          <h2
            className="text-2xl font-normal leading-none md:text-3xl"
            style={{ color: "#111111", fontFamily: "Georgia, serif" }}
          >
            {title}
          </h2>
        </div>

        <div
          className="text-[15px] leading-relaxed md:text-base"
          style={{ color: "#000000" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- ICONS ---------- */

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}