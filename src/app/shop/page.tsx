import { createClient } from "@/lib/supabase/server";
import ShopGrid from "../components/ShopGrid";
import HandmadeNote from "../components/HandmadeNote";
import { pageMeta } from '@/lib/seo'
import { accentOf } from "@/lib/categoryColors";
export const dynamic = "force-dynamic";
const STRIPE_COUNT = 21;

// Look & feel per category slug. Any category added later from the admin panel
// that isn't listed here automatically uses DEFAULT_STYLE.
// Subtitle per category slug. Colors now come from the admin panel.
const CATEGORY_SUBTITLES: Record<string, string> = {
  candle: "Handmade candles",
  giveaway: "Made for moments",
  diffuser: "Scent, beautifully diffused",
};
const DEFAULT_SUBTITLE = "Made with love";
const SHOP_ALL = {
  title: "Shop All",
  subtitle: "little things made with love",
  accent: "#657A55",
};

type Category = {
  slug: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  accent: string | null;
};

// Turns whatever is in the URL into a real category slug.
// Old plural links (?category=candles) still work.
function resolveCategory(raw: string | undefined, categories: Category[]) {
  if (!raw) return null;
  const value = raw.toLowerCase();
  const slugs = categories.map((c) => c.slug);
  if (slugs.includes(value)) return value;
  const singular = value.replace(/s$/, "");
  if (slugs.includes(singular)) return singular;
  return null;
}

export const metadata = pageMeta('Handmade Scented Candles in Egypt', 'Shop handmade scented candles in every scent, made to order in Egypt, or design your own custom photo candle.', '/shop')
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;

  const supabase = await createClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
         .select("slug, name, sort_order, is_visible, accent")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (productsRes.error) {
    console.error("Failed to fetch products:", productsRes.error.message);
  }
  if (categoriesRes.error) {
    console.error("Failed to fetch categories:", categoriesRes.error.message);
  }

  const products = productsRes.data ?? [];
  const categories = (categoriesRes.data ?? []) as Category[];

  const category = resolveCategory(rawCategory, categories);
  const activeCategory = categories.find((c) => c.slug === category);
  const { title, subtitle, accent } = activeCategory
    ? {
        title: activeCategory.name,
        subtitle: CATEGORY_SUBTITLES[activeCategory.slug] ?? DEFAULT_SUBTITLE,
        accent: accentOf(activeCategory.accent),
      }
    : SHOP_ALL;

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
          products={products}
          accent={accent}
          category={category}
        />
      </main>
    </div>
  );
}