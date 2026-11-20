import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";
import ActiveToggle from "@/app/components/ActiveToggle";

type Category = {
  slug: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
};

// `display_name` is a new column on `products`. It is added here so this file works
// even if lib/supabase/types.ts doesn't list it yet.
type ProductWithDisplayName = Product & { display_name?: string | null };

// Accent color per category. Categories not listed here use the default.
const CATEGORY_COLORS: Record<string, string> = {
  candle: "#D8A1AF",
  giveaway: "#6E86C7",
  diffuser: "#8C8680",
  customizable: "#DE4B33",
};
const DEFAULT_COLOR = "#657A55";

// Price text for the card: the product's own price, or the real range
// from its sizes/options when the price lives there (e.g. 450-680 EGP).
function priceLabel(product: Product): string {
  if (product.price != null && String(product.price) !== "") {
    return `${product.price} EGP`;
  }

  const prices: number[] = [];
  product.colors?.forEach((color: any) => {
    if (color.options?.length) {
      color.options.forEach((o: any) => o.price != null && prices.push(Number(o.price)));
    } else if (color.price != null) {
      prices.push(Number(color.price));
    }
  });

  if (prices.length === 0) return "No price set";

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${min} EGP` : `${min}–${max} EGP`;
}

// Fallback names for products that don't have a Display name saved yet
// (the real product name is unchanged). Once display_name is filled in
// for a product, its entry here can be deleted.
const DISPLAY_NAMES: Record<string, string> = {
  "candle (customized)": "Custom Candle",
};

function ProductCard({ product, accent }: { product: ProductWithDisplayName; accent: string }) {
  const displayName =
    product.display_name?.trim() ||
    DISPLAY_NAMES[product.name.trim().toLowerCase()] ||
    product.name;
  const thumb =
    product.image_urls?.[0] ??
    product.colors?.[0]?.image_urls?.[0] ??
    product.colors?.[0]?.image_url ??
    null;

  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="relative flex items-center gap-4 overflow-hidden rounded-2xl py-3 pl-5 pr-3 transition-colors hover:bg-black/5"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#FFF9F0",
        opacity: product.is_active === false ? 0.55 : 1,
      }}
    >
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: accent }} />

      <div
        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: "#EFE3C4" }}
      >
        {thumb && (
          <img src={thumb} alt={displayName} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-serif text-base font-bold leading-tight" style={{ color: "#000000" }}>
          {displayName}
        </p>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: accent }}>
          {priceLabel(product)}
        </p>
      </div>

      <ActiveToggle productId={product.id} initialActive={product.is_active ?? true} />
    </Link>
  );
}

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select("*").is("deleted_at", null).order("name"),
    // Admin sees every category, including ones hidden on the site.
    supabase
      .from("categories")
      .select("slug, name, sort_order, is_visible")
      .order("sort_order", { ascending: true }),
  ]);

  if (productsRes.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#000000" }}>
          Products
        </h1>
        <p className="text-sm" style={{ color: "#DE4B33" }}>
          Couldn't load products: {productsRes.error.message}
        </p>
      </div>
    );
  }

  // Builder products that are already covered by their giveaway product,
  // so they don't need a card in the admin list.
  const HIDDEN_IN_ADMIN_LIST = ["fan (customized)", "mini candles (customized)"];

  const all = ((productsRes.data ?? []) as ProductWithDisplayName[]).filter(
    (p) => !HIDDEN_IN_ADMIN_LIST.includes(p.name.trim().toLowerCase())
  );
  // "Customizable" is no longer a category: every product lives in a real one.
  const categories = ((categoriesRes.data ?? []) as Category[]).filter(
    (c) => c.slug !== "customizable"
  );

  // Products whose category doesn't match any category row (safety net).
  const knownSlugs = new Set(categories.map((c) => c.slug));
  const uncategorized = all.filter((p) => !knownSlugs.has(p.category ?? ""));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#000000" }}>
          Products
        </h1>

        <Link
          href="/admin/products/new"
          className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
        >
          + Add Product
        </Link>
      </div>

      {categories.map((cat) => {
        const items = all.filter((p) => p.category === cat.slug);
        const accent = CATEGORY_COLORS[cat.slug] ?? DEFAULT_COLOR;

        return (
          <section key={cat.slug} className="mb-10">
            <h2
              className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {cat.name} ({items.length})
              {!cat.is_visible && (
                <span
                  className="ml-2 font-semibold normal-case tracking-normal"
                  style={{ color: "rgba(0,0,0,0.45)" }}
                >
                  hidden on site
                </span>
              )}
            </h2>

            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
                  No products in this category yet.
                </p>
              ) : (
                items.map((product) => (
                  <ProductCard key={product.id} product={product} accent={accent} />
                ))
              )}
            </div>
          </section>
        );
      })}

      {uncategorized.length > 0 && (
        <section className="mb-10">
          <h2
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: "#DE4B33" }}
          >
            No category ({uncategorized.length})
          </h2>
          <div className="flex flex-col gap-2">
            {uncategorized.map((product) => (
              <ProductCard key={product.id} product={product} accent="#DE4B33" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}