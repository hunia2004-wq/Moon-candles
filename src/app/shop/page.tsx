import { createClient } from "@/lib/supabase/server";
import ShopGrid from "../components/ShopGrid";

const STRIPE_COUNT = 21;

const TITLES: Record<string, { title: string; subtitle: string; accent: string }> = {
  candles: { title: "Candles", subtitle: "every candle, handpoured", accent: "#D8A1AF" },
  giveaways: { title: "Giveaways", subtitle: "just for you", accent: "#6E86C7" },
};

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { title, subtitle, accent } = TITLES[category ?? ""] ?? {
    title: "Shop All",
    subtitle: "every candle, handpoured",
    accent: "#657A55",
  };

  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error.message);
  }

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <div className="relative w-full h-10 md:h-14 overflow-hidden">
        <div className="absolute inset-0 flex">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: i % 2 === 0 ? accent : "#efe3c4" }}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:px-16 md:py-16">
        <p
          className="uppercase tracking-[0.25em] text-xs md:text-sm mb-2"
          style={{ color: accent }}
        >
          {subtitle}
        </p>
        <h1
          className="mb-10 text-3xl md:text-5xl font-bold tracking-wide"
          style={{ color: "#000000" }}
        >
          {title}
        </h1>

        <ShopGrid products={products ?? []} accent={accent} />
      </main>
    </div>
  );
}