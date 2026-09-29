"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import AutoCenteredImage from "./AutoCenteredImage";


// These products don't have one fixed price — show a range instead of
// product.price. Matched case-insensitively against product.name.
const PRICE_RANGE_OVERRIDES: Record<string, string> = {
  "forever clasp": "85-95 EGP",
  "pocket hearts": "40-50 EGP",
  "rustic warmth": "65-75 EGP",
};

type ActiveDiscount = {
  type: string | null;
  value: number | null;
};

export default function ShopGrid({ products, accent = "#657A55" }: { products: Product[]; accent?: string }) {
  const searchParams = useSearchParams();
  const targetProduct = searchParams.get("product");
  const category = searchParams.get("category"); // "candles" | "giveaways" | null
  const refs = useRef<Record<number, HTMLAnchorElement | null>>({});
  const [discountsByProduct, setDiscountsByProduct] = useState<Record<number, ActiveDiscount>>({});

  useEffect(() => {
    if (!targetProduct) return;
    const match = products.find((p) => p.name === targetProduct);
    if (match && refs.current[match.id]) {
      refs.current[match.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetProduct, products]);

  // Pulls every active promotion currently attached to any product, and
  // builds a map of productId -> discount so cards can show a struck-through
  // original price next to the discounted one. Runs once on mount; since
  // it queries live, a promotion the owner activates/deactivates later is
  // picked up on the shop page's next load without any code changes.
  useEffect(() => {
    loadActiveDiscounts();
  }, []);

  async function loadActiveDiscounts() {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id, promotions(discount_type, discount_value, is_active, starts_at, ends_at)");

    if (error) {
      console.error("Failed to load promotion discounts:", error.message);
      return;
    }

      if (!data) return;

    console.log("promotion_products raw data:", JSON.stringify(data, null, 2));

    const map: Record<number, ActiveDiscount> = {};

    for (const row of data as any[]) {
      const promo = row.promotions;
            if (!promo || !promo.is_active) continue;
      if (promo.starts_at && promo.starts_at > nowIso) continue;
      if (promo.ends_at && promo.ends_at < nowIso) continue;

      map[row.product_id] = {
        type: promo.discount_type,
        value: promo.discount_value,
      };
    }

    setDiscountsByProduct(map);
  }

  const filteredProducts = products.filter((product) => {
    if (!category) return true;
    if (category === "giveaways") return product.category === "giveaway";
    if (category === "candles") return product.category === "candle";
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
        const priceOverride = PRICE_RANGE_OVERRIDES[product.name.toLowerCase()];
        const discount = discountsByProduct[product.id];
        let discountedPrice: number | null = null;
        if (discount && !priceOverride) {
          if (discount.type === "percentage" && discount.value != null) {
            discountedPrice = Math.round(product.price * (1 - discount.value / 100));
          } else if (discount.type === "fixed" && discount.value != null) {
            discountedPrice = Math.max(0, product.price - discount.value);
          }
        }

        // Badge label for every discount type — percentage/fixed also get
        // a recalculated price above; BOGO and free shipping are
        // badge-only, since there's no single-item price to change.
        let badgeLabel: string | null = null;
        if (discount?.type === "percentage" && discount.value != null) {
          badgeLabel = `${discount.value}% OFF`;
        } else if (discount?.type === "fixed" && discount.value != null) {
          badgeLabel = `${discount.value} EGP OFF`;
        } else if (discount?.type === "bogo") {
          badgeLabel = "BUY 1 GET 1";
        } else if (discount?.type === "free_shipping") {
          badgeLabel = "FREE SHIPPING";
        }

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
            <div className="relative flex aspect-square items-center justify-center overflow-hidden p-4">
              {cover && (
                <AutoCenteredImage
                  src={cover}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
                           {badgeLabel && (
                <span
                  className="absolute top-2 left-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: "#DE4B33", color: "#FFFFFF" }}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
           <div className="flex flex-1 flex-col gap-1 px-4 py-3 justify-center" style={{ backgroundColor: "#efe3c4" }}>
              <p
                className="text-sm font-semibold uppercase tracking-wide md:text-base"
                style={{ color: "#000000" }}
              >
                {product.name}
              </p>

              {priceOverride ? (
                <p className="text-sm font-medium" style={{ color: accent }}>
                  {priceOverride}
                </p>
              ) : discountedPrice != null ? (
                <p className="text-sm font-medium flex items-center gap-2">
                  <span style={{ color: "rgba(0,0,0,0.4)", textDecoration: "line-through" }}>
                    {product.price} EGP
                  </span>
                  <span style={{ color: "#DE4B33", fontWeight: 700 }}>{discountedPrice} EGP</span>
                </p>
              ) : (
                <p className="text-sm font-medium" style={{ color: accent }}>
                  {product.price} EGP
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}