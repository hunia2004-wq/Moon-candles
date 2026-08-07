"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";
import AutoCenteredImage from "./AutoCenteredImage";

export default function ShopGrid({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const targetProduct = searchParams.get("product");
  const refs = useRef<Record<number, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (!targetProduct) return;
    const match = products.find((p) => p.name === targetProduct);
    if (match && refs.current[match.id]) {
      refs.current[match.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetProduct, products]);

  if (products.length === 0) {
    return <p style={{ color: "#000000" }}>No products available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-8">
      {products.map((product) => {
        const cover = product.image_urls?.[0] ?? product.colors?.[0]?.image_url;
        const isTarget = product.name === targetProduct;

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            ref={(el) => {
              refs.current[product.id] = el;
            }}
            className="flex flex-col overflow-hidden rounded-2xl transition-shadow"
            style={{
              backgroundColor: "#FFFFFF",
              outline: isTarget ? "3px solid #FF5A36" : "none",
              outlineOffset: "2px",
              boxShadow: "0 4px 16px rgba(255,214,184,0.25)",
            }}
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden bg-white p-4">
              {cover && (
                <AutoCenteredImage
                  src={cover}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="flex flex-col gap-1 px-4 py-3">
              <p
                className="text-sm font-semibold uppercase tracking-wide md:text-base"
                style={{ color: "#000000" }}
              >
                {product.name}
              </p>
              <p className="text-sm" style={{ color: "#000000" }}>
                {product.price} EGP
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
