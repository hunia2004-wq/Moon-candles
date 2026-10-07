"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#47684b";

/*
 * ============================================================
 * FALLBACK REVIEW DATA
 * ============================================================
 * Shown only until you feature at least one review in the admin
 * panel (Reviews → Feature). Once a featured review exists in
 * Supabase, this list is ignored automatically.
 *
 * `name` is optional — leave it out (or use an empty string) for
 * any review you don't have a name for yet, and it'll fall back to
 * "Verified Buyer" instead of showing a blank.
 *
 * `stars` is 1-5.
 */
type Review = {
  stars: number;
  quote: string;
  name?: string;
};

const FALLBACK_REVIEWS: Review[] = [
  {
    stars: 5,
    quote:
      "Hello, I just wanted to thank you so so much for the candle. That's my second order so far and the quality is beyond premium. Both fragrances are really distinguishable and unique! Definitely won't be my last order",
    name: "Jomana",
  },
  {
    stars: 5,
    quote:
      "I received the candle today and it is more than amazing, seriously!!! Looks and smells amazingggg!! Thank youuu",
    name: "Karma",
  },
  {
    stars: 5,
    quote:
      "Thank you so much, I really love the packaging and everything. I'm really glad that I got to deal with such an amazing business.",
    name: "Huda",
  },
  {
    stars: 5,
    quote:
      "Hii, el order wesell w mazbout 100%! Well hagaa tohfaaaa. Not the last time AKIDDD!!! Thank youuu",
    name: "Dahlia",
  },
  {
    stars: 5,
    quote:
      "Your candles are so good that now we officially need you to make us a body butter too. Like why should only the room smell amazing? We deserve to smell just as good. Ana mestanya kda kda",
    name: "Tasneem",
  },
  {
    stars: 5,
    quote: "Thank you for your help and respect begad. Keep going on the same attitude.",
    name: "Nouran",
  },
  {
    stars: 5,
    quote: "Just received my order and am really happy about it",
    name: "Dina",
  },
  {
    stars: 5,
    quote:
      "Habibty, teslam edk bgd tohfaaaa. Smells so so good begad. Both smells awesome. Rabna yewf2k",
    name: "Sagda",
  },
  {
    stars: 5,
    quote:
      "Waslo bgd to7faaaa. Dol fo2 el too7faaa bgd wlhahy 5teraaa",
    name: "Shahd",
  },
  {
    stars: 5,
    quote:
      "BTW, the candles I got last time were absolutely incredible. Everyone who walked into my room couldn't believe the scent was from a candle. They thought I had used an air freshener. Bgd thank you touhfa",
    name: "Tasnim",
  },
  {
    stars: 5,
    quote:
      "حاجه وصلت شكرا اووى يا حبيبتى تعبتك معايا اووى شكرا بجد حاجه حلوه اووى اووى ",
    name: "Marina",
  },
];

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);

  useEffect(() => {
  async function loadFeaturedReviews() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("customer_name, rating, body")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return;

const featuredReviews: Review[] = data.map((r) => ({
  stars: r.rating,
  quote: r.body,
  name: r.customer_name,
}));

setReviews([...FALLBACK_REVIEWS, ...featuredReviews]);
  }

  loadFeaturedReviews();
}, []);

  function scrollToIndex(index: number) {
    const safeIndex = Math.max(0, Math.min(index, reviews.length - 1));
    const container = scrollRef.current;
    const card = cardRefs.current[safeIndex];

    if (!container || !card) return;

    const containerWidth = container.clientWidth;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.clientWidth;

    container.scrollTo({
      left: cardLeft - (containerWidth - cardWidth) / 2,
      behavior: "smooth",
    });

    setActiveIndex(safeIndex);
  }

  function previous() {
    scrollToIndex(activeIndex <= 0 ? reviews.length - 1 : activeIndex - 1);
  }

  function next() {
    scrollToIndex(activeIndex >= reviews.length - 1 ? 0 : activeIndex + 1);
  }

  // Keep the dots/arrows in sync if someone swipes instead of tapping.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const c = scrollRef.current;
        if (!c) {
          ticking = false;
          return;
        }

        const center = c.scrollLeft + c.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const cardCenter = card.offsetLeft + card.clientWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });

        setActiveIndex(closest);
        ticking = false;
      });
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [reviews]);

  if (reviews.length === 0) return null;

  return (
       <section
      className="w-full overflow-hidden py-14 md:py-20"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* ============================================================
            HEADING — matches the "Best Sellers" heading pattern already
            used on the homepage (black eyebrow + black serif heading)
            ============================================================ */}

        <div className="flex flex-col items-center text-center mb-10 md:mb-14">
          <p
            className="uppercase tracking-[0.20em] text-xs md:text-sm mb-1"
            style={{ color: "#000000" }}
          >
            what people are saying
          </p>

          <h2
            className="font-serif text-3xl md:text-5xl font-bold text-center"
            style={{ color: "#000000" }}
          >
            Customer Testimonials
          </h2>
        </div>

        {/* ============================================================
            CAROUSEL
            ============================================================ */}

                      <div className="relative sm:left-1/2 sm:w-screen sm:-translate-x-1/2">
          {/* PREV */}
          <button
            type="button"
            onClick={previous}
            aria-label="Previous review"
            className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-transform hover:scale-110 md:flex"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <ChevronLeft size={20} color="#000000" />
          </button>

          {/* NEXT */}
          <button
            type="button"
            onClick={next}
            aria-label="Next review"
            className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full backdrop-blur transition-transform hover:scale-110 md:flex"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <ChevronRight size={20} color="#000000" />
          </button>

          <div
            ref={scrollRef}
                       className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-2 py-2 sm:px-[calc(50%-180px)]"
            style={{
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {reviews.map((review, index) => (
              <div
                key={index}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
className="w-[86%] flex-shrink-0 snap-center px-3 sm:w-[360px]"
              >
                <div
  className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl px-7 pb-7 pt-9 text-left shadow-sm"
  style={{ backgroundColor: "#FFFFFF" }}
>
  {/* Colored accent stripe along the top */}
  <div
    className="absolute left-0 top-0 h-1.5 w-full"
    style={{ backgroundColor: ACCENT }}
  />

  {/* Oversized decorative quote mark */}
  <span
    className="pointer-events-none absolute -top-2 right-5 select-none font-serif text-7xl leading-none opacity-[0.08]"
    style={{ color: ACCENT }}
  >
    "
  </span>

  {/* STARS */}
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <StarIcon key={i} filled={i < review.stars} />
    ))}
  </div>

  {/* QUOTE */}
  <p
className="relative text-sm leading-relaxed"
    style={{ color: "rgba(0,0,0,0.75)" }}
  >
    {review.quote}
  </p>

  {/* NAME */}
  <div className="mt-auto flex items-center gap-3 pt-3">
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
    >
      {(review.name?.trim() || "Verified Buyer").charAt(0).toUpperCase()}
    </span>

    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold" style={{ color: "#000000" }}>
        {review.name?.trim() || "Verified Buyer"}
      </span>
      <BadgeCheck size={14} color="#FFFFFF" fill={ACCENT} />
    </div>
  </div>
</div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            DOTS
            ============================================================ */}

        <div className="mt-6 flex justify-center gap-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to review ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: activeIndex === index ? "24px" : "6px",
                backgroundColor:
                  activeIndex === index ? ACCENT : "#D8C9B0",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M12 2.5l2.9 6.3 6.8.6-5.2 4.6 1.6 6.7L12 17.3l-6.1 3.4 1.6-6.7L2.3 9.4l6.8-.6L12 2.5z"
        fill={filled ? ACCENT : "none"}
        stroke={filled ? ACCENT : "rgba(0,0,0,0.25)"}
        strokeWidth="1.2"
      />
    </svg>
  );
}