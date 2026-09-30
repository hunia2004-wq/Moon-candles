import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

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

function ProductCard({ product }: { product: Product }) {
   const thumb =
    product.image_urls?.[0] ??
    product.colors?.[0]?.image_urls?.[0] ??
    product.colors?.[0]?.image_url ??
    null;

  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-black/5"
      style={{ border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div
        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: "#EFE3C4" }}
      >
        {thumb && (
          <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: "#000000" }}>
          {product.name}
        </p>
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
          {product.price} EGP
        </p>
      </div>

      {product.is_featured && (
        <span
          className="flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "#D8A1AF", color: "#FFF4E6" }}
        >
          Featured
        </span>
      )}
    </Link>
  );
}

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold" style={{ color: "#000000" }}>
          Products
        </h1>
        <p className="text-sm" style={{ color: "#DE4B33" }}>
          Couldn't load products: {error.message}
        </p>
      </div>
    );
  }

  const all = (products ?? []) as Product[];

  const giveaways = all.filter((p) =>
    GIVEAWAY_NAMES.some((name) => name.toLowerCase() === p.name.toLowerCase())
  );

  const regular = all.filter(
    (p) => !GIVEAWAY_NAMES.some((name) => name.toLowerCase() === p.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#000000" }}>
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
          style={{ color: "#DE4B33" }}
        >
          Candles ({regular.length})
        </h2>

        <div className="flex flex-col gap-2">
          {regular.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
              No candles yet.
            </p>
          ) : (
            regular.map((product) => <ProductCard key={product.id} product={product} />)
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
            giveaways.map((product) => <ProductCard key={product.id} product={product} />)
          )}
        </div>
      </section>
    </div>
  );
}