import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";
import ActiveToggle from "@/app/components/ActiveToggle";

const GIVEAWAY_NAMES = [
  "Mini Candles",
  "Quack and Kiss",
  "Tambourine",
  "Fan",
  "Bloom Wand",
  "Forever Clasp",
  "Pocket Hearts",
  "Rustic Warmth",
];

function ProductCard({ product, accent }: { product: Product; accent: string }) {
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
          <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-bold" style={{ color: "#000000" }}>
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: accent }}>
          {product.price} EGP
        </p>
      </div>

      <ActiveToggle productId={product.id} initialActive={product.is_active ?? true} />
    </Link>
  );
}

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#000000" }}>
          Products
        </h1>
        <p className="text-sm" style={{ color: "#DE4B33" }}>
          Couldn't load products: {error.message}
        </p>
      </div>
    );
  }

  const all = (products ?? []) as Product[];

 const isGiveaway = (p: Product) =>
  p.category === "giveaway" ||
  p.category === "customizable" ||
  GIVEAWAY_NAMES.some((name) => name.toLowerCase() === p.name.toLowerCase());

const giveaways = all.filter(isGiveaway);
const regular = all.filter((p) => !isGiveaway(p));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#000000" }}>
          Products
        </h1>

        <Link
          href="/admin/products/new"
          className="rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
        >
          + Add Product
        </Link>
      </div>

      <section className="mb-10">
        <h2
                   className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "#D8A1AF" }}
        >
          Candles ({regular.length})
        </h2>

        <div className="flex flex-col gap-2">
          {regular.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
              No candles yet.
            </p>
          ) : (
                       regular.map((product) => (
              <ProductCard key={product.id} product={product} accent="#D8A1AF" />
            ))
          )}
        </div>
      </section>

      <section>
        <h2
          className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "#6E86C7" }}
        >
          Giveaways ({giveaways.length})
        </h2>

        <div className="flex flex-col gap-2">
          {giveaways.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
              No giveaways yet.
            </p>
          ) : (
                        giveaways.map((product) => (
              <ProductCard key={product.id} product={product} accent="#6E86C7" />
            ))
          )}
        </div>
      </section>
    </div>
  );
}