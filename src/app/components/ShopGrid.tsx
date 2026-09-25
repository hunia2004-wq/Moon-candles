"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";
import AutoCenteredImage from "./AutoCenteredImage";

// Same names used in the hamburger menu's Giveaways group. Anything not
// in this list is treated as a candle for filtering purposes.
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
// These products don't have one fixed price — show a range instead of
// product.price. Matched case-insensitively against product.name.
const PRICE_RANGE_OVERRIDES: Record<string, string> = {
  "forever clasp": "85-95 EGP",
  "pocket hearts": "40-50 EGP",
  "rustic warmth": "65-75 EGP",
};
export default function ShopGrid({ products, accent = "#657A55" }: { products: Product[]; accent?: string }) {
  const searchParams = useSearchParams();
  const targetProduct = searchParams.get("product");
  const category = searchParams.get("category"); // "candles" | "giveaways" | null
  const refs = useRef<Record<number, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (!targetProduct) return;
    const match = products.find((p) => p.name === targetProduct);
    if (match && refs.current[match.id]) {
      refs.current[match.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetProduct, products]);

  const filteredProducts = products.filter((product) => {
    if (!category) return true;
    const isGiveaway = GIVEAWAY_NAMES.includes(product.name);
    if (category === "giveaways") return isGiveaway;
    if (category === "candles") return !isGiveaway;
    return true;
  });

  if (filteredProducts.length === 0) {
    return <p style={{ color: "#000000" }}>No products available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
      {filteredProducts.map((product) => {
        const cover = product.image_urls?.[0] ?? product.colors?.[0]?.image_url;
        const isTarget = product.name === targetProduct;

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            ref={(el) => {
              refs.current[product.id] = el;
            }}
            className="flex flex-col overflow-hidden rounded-2xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
            style={{
              backgroundColor: "#FFFFFF",
              outline: isTarget ? `3px solid ${accent}` : "none",
              outlineOffset: "2px",
              boxShadow: "0 4px 16px rgba(70,85,61,0.1)",
            }}
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden p-4">
              {cover && (
                <AutoCenteredImage
                  src={cover}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
           <div className="flex flex-1 flex-col gap-1 px-4 py-3 justify-center" style={{ backgroundColor: "#efe3c4" }}>
              <p
                className="text-sm font-semibold uppercase tracking-wide md:text-base"
                style={{ color: "#000000" }}
              >
                {product.name}
              </p>
              <p className="text-sm font-medium" style={{ color: accent }}>
  {PRICE_RANGE_OVERRIDES[product.name.toLowerCase()] ?? `${product.price} EGP`}
</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}