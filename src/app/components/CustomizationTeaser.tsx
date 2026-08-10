import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Feature photos — pass real URLs in via props once you have them, or */
/* just edit the two constants below directly. */
/* ------------------------------------------------------------------ */
const MEMORIES_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%201.jpg";
const WORDS_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%202.jpg";

/**
 * Homepage teaser for the candle customization flow. Links out to /customize
 * for the full builder (photo + message + size/price).
 *
 * Layout: a real arch-shaped card (not a decorative overlay) — the top
 * corners are rounded to a full semicircle at the card's own width, so it
 * reads as a doorway/arch shape framing the content, matching the reference.
 */
export default function CustomizationTeaser() {
  return (
    <section
      className="w-full flex justify-center px-4 py-12 md:py-20"
      style={{ backgroundColor: "#FFF4E6" }}
    >
      <div
        className="w-full flex flex-col items-center text-center px-6 md:px-10 pt-10 md:pt-14 pb-10"
        style={{
          maxWidth: 560,
          border: "6px solid #8FAA82",
          borderRadius: "280px 280px 30px 30px",
        }}
      >
        {/* crescent mark */}
        <svg width="30" height="30" viewBox="0 0 34 34" fill="none" className="mb-4">
          <path
            d="M22 4C16 6 12 11 12 17s4 11 10 13c-8 1-16-5-16-13S14 3 22 4Z"
            fill="#8FAA82"
          />
        </svg>

        <p
          className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3"
          style={{ color: "#8FAA82" }}
        >
          made by you, for you
        </p>

        <h2 className="font-serif leading-[1.05] mb-4">
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customization
          </span>
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#8FAA82" }}>
            made special
          </span>
        </h2>

        <p className="text-sm md:text-base mb-8" style={{ color: "rgba(0,0,0,0.62)" }}>
          Add a photo. Add a message. Make it meaningful.
        </p>

        <div className="grid grid-cols-2 gap-4 md:gap-5 w-full mb-8">
          <FeatureCard
            img={MEMORIES_IMG}
            imgAlt="A candle label showing an added photo"
            icon={<PhotoIcon />}
            title="Your memories"
            description="Add your favorite photo to the label."
          />
          <FeatureCard
            img={WORDS_IMG}
            imgAlt="A candle label with a handwritten message"
            icon={<PencilIcon />}
            title="Your words"
            description="Write a name, a date, or a message."
          />
        </div>

        <Link
          href="/customize"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#8FAA82", color: "#FFF4E6" }}
        >
          Create your candle
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

function FeatureCard({
  img,
  icon,
  title,
  description,
  imgAlt,
}: {
  img: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  imgAlt: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full aspect-auto rounded-2xl overflow-hidden mb-3"
        style={{ backgroundColor: "#EFE3C4" }}
      >
        <img src={img} alt={imgAlt} className="w-full h-full object-contain" />
      </div>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: "#FFF4E6", border: "1px solid #8FAA82" }}
      >
        {icon}
      </div>
      <p
        className="uppercase tracking-[0.15em] text-[11px] md:text-xs font-medium mb-1"
        style={{ color: "#8FAA82" }}
      >
        {title}
      </p>
      <p className="text-xs md:text-sm text-center" style={{ color: "rgba(0,0,0,0.62)" }}>
        {description}
      </p>
    </div>
  );
}

function PhotoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FAA82" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="#8FAA82" stroke="none" />
      <path d="M21 16l-5.5-5.5L9 17" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FAA82" strokeWidth="1.6">
      <path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z" />
      <path d="M14 5l3 3" />
    </svg>
  );
}