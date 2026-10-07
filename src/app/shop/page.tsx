import { createClient } from "@/lib/supabase/server";
import ShopGrid from "../components/ShopGrid";
import HandmadeNote from "../components/HandmadeNote";

export const dynamic = "force-dynamic";
const STRIPE_COUNT = 21;

const TITLES: Record<
  string,
  { title: string; subtitle: string; accent: string }
> = {
  candles: {
    title: "Candles",
    subtitle: "Handmade candles",
    accent: "#D8A1AF",
  },
  giveaways: {
    title: "Giveaways",
    subtitle: "Made for moments",
    accent: "#6E86C7",
  },
};

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const { title, subtitle, accent } =
    TITLES[category ?? ""] ?? {
      title: "Shop All",
      subtitle: "little things made with love",
      accent: "#657A55",
    };

  const supabase = await createClient();

     const { data: products, error } = await supabase
     .from("products")
     .select("*")
     .eq("is_active", true).is("deleted_at", null)
              .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error.message);
  }

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <div className="relative h-10 w-full overflow-hidden md:h-14">
        <div className="absolute inset-0 flex">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor:
                  i % 2 === 0 ? accent : "#efe3c4",
              }}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:px-16 md:py-16">

        {/* SECTION INTRO */}
                <div className="mb-2 md:mb-3">
          <p
            className="mb-1 text-sm italic md:text-base"
            style={{
              color: accent,
              fontFamily: "Georgia, serif",
            }}
          >
            {subtitle}
          </p>

          <h1
            className="text-4xl font-medium leading-tight md:text-6xl"
            style={{
              color: "#000000",
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "-0.035em",
            }}
          >
            {title}
          </h1>
        </div>

                   <div className="mb-5">
          <HandmadeNote accent={accent} />
        </div>

        <ShopGrid
          products={products ?? []}
          accent={accent}
        />
      </main>
    </div>
  );
}