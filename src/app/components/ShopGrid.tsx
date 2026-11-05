"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import AutoCenteredImage from "./AutoCenteredImage";


// For products with per-option pricing (e.g. Unscented/Scented at
// different prices), compute the real min–max range from the
// product's actual color/option prices instead of a hardcoded string.
function getPriceRange(product: Product): string | null {
  const prices: number[] = [];

  product.colors?.forEach((color) => {
    if (color.options?.length) {
      color.options.forEach((option) => {
        if (option.price != null) prices.push(option.price);
      });
    } else if (color.price != null) {
      prices.push(color.price);
    }
  });

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return null;

  return `${min}-${max} EGP`;
}

type ActiveDiscount = {
  type: string | null;
  value: number | null;
};
const CUSTOM_SIZES = [
  {
    id: "small",
    label: "150 ML",
    price: 450,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20150.png",
  },
  {
    id: "large",
    label: "380 ML",
    price: 680,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20380.png",
  },
] as const;

function CustomCandleCard({ accent }: { accent: string }) {
  const [sizeId, setSizeId] = useState<"small" | "large">("large");
  const current = CUSTOM_SIZES.find((s) => s.id === sizeId)!;
  const href = `/customize?size=${sizeId}`;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl transition-all duration-150 hover:shadow-lg"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 4px 16px rgba(70,85,61,0.1)" }}
    >
      <Link href={href} className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden p-4">
          <div className="h-full w-full">
            <AutoCenteredImage
              key={current.id}
              src={current.img}
              alt={`Custom photo candle ${current.label}`}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </Link>

      <div
        className="flex flex-1 flex-col gap-2 px-4 py-3 justify-center"
        style={{ backgroundColor: "#efe3c4" }}
      >
        <Link href={href}>
          <p
            className="text-sm font-semibold uppercase tracking-wide md:text-base"
            style={{ color: "#000000" }}
          >
            Custom Candle
          </p>
        </Link>

        <div className="flex gap-2">
          {CUSTOM_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSizeId(s.id)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{
                color: sizeId === s.id ? "#FFFFFF" : "#000000",
                backgroundColor: sizeId === s.id ? accent : "transparent",
                border: `1.5px solid ${sizeId === s.id ? accent : "rgba(0,0,0,0.2)"}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-sm font-medium" style={{ color: accent }}>
          {current.price} EGP
        </p>
      </div>
    </div>
  );
}
const PLAIN_SIZES = [
  {
    id: "small",
    label: "150 ML",
    price: 400,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/150ml.png?v=2",
  },
  {
    id: "large",
    label: "380 ML",
    price: 620,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/380ml.png",
  },
] as const;
function PlainCandleCard({
  product,
  accent,
}: {
  product: Product;
  accent: string;
}) {
  const [sizeId, setSizeId] = useState<"small" | "large">("small");
  const current = PLAIN_SIZES.find((s) => s.id === sizeId)!;
  const href = `/product/${product.id}`;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl transition-all duration-150 hover:shadow-lg"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 4px 16px rgba(70,85,61,0.1)" }}
    >
      <Link href={href} className="block">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden p-4">
          <div className="h-full w-full">
            <AutoCenteredImage
              key={current.id}
              src={current.img}
              alt={`${product.name} ${current.label}`}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </Link>

      <div
        className="flex flex-1 flex-col gap-2 px-4 py-3 justify-center"
        style={{ backgroundColor: "#efe3c4" }}
      >
        <Link href={href}>
          <p
            className="text-sm font-semibold uppercase tracking-wide md:text-base"
            style={{ color: "#000000" }}
          >
            {product.name}
          </p>
        </Link>

        <div className="flex gap-2">
          {PLAIN_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSizeId(s.id)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{
                color: sizeId === s.id ? "#FFFFFF" : "#000000",
                backgroundColor: sizeId === s.id ? accent : "transparent",
                border: `1.5px solid ${sizeId === s.id ? accent : "rgba(0,0,0,0.2)"}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

               <p className="text-sm font-medium" style={{ color: accent }}>
          {current.price} EGP
        </p>
      </div>
    </div>
  );
}
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
  const showCustomCard = !category || category === "candles";
   
 const filteredProducts = products.filter((product) => {
  if (product.category === "customizable") return false; // add this line
  if (!category) return true;
  if (category === "giveaways") return product.category === "giveaway";
  if (category === "candles") return product.category === "candle";
  return true;
});

    if (filteredProducts.length === 0 && !showCustomCard) {
    return <p style={{ color: "#000000" }}>No products available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
      {filteredProducts.map((product) => {
       const cover =
  product.image_urls?.[0] ??
  product.colors?.[0]?.image_url ??
  product.colors?.[0]?.image_urls?.[0];
        const isTarget = product.name === targetProduct;
        const soldOut = !!(product as Product & { out_of_stock?: boolean | null }).out_of_stock;
        const priceOverride = getPriceRange(product);
                       if (product.id === 21) {
          return (
            <PlainCandleCard
              key={product.id}
              product={product}
              accent={accent}
            />
          );
        }
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
                               <div className={`h-full w-full transition-opacity ${soldOut ? "opacity-50" : ""}`}>
                  <AutoCenteredImage
                    src={cover}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
                           {badgeLabel && (
                <span
                  className="absolute top-2 left-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: "#DE4B33", color: "#FFFFFF" }}
                >
                                  {badgeLabel}
                </span>
              )}
                 {soldOut && (
  <span
    className="absolute right-0 top-0 z-10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm"
    style={{
      backgroundColor: "#DE4B33",
      borderRadius: "0 12px 0 12px",
      boxShadow: "0 3px 10px rgba(222,75,51,0.2)",
    }}
  >
    Sold Out
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

           {showCustomCard && <CustomCandleCard accent={accent} />}
    </div>
  );
}