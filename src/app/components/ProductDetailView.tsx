"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/supabase/types";

export default function ProductDetailView({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const preselectedColor = searchParams.get("color");

  const initialColorIndex = Math.max(
    0,
    product.colors?.findIndex((c) => c.name === preselectedColor) ?? 0
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(
    initialColorIndex === -1 ? 0 : initialColorIndex
  );
  const [selectedScent, setSelectedScent] = useState<string | null>(
    product.scents?.[0] ?? null
  );

  const hasColors = product.colors?.length > 0;
  const selectedColor = product.colors?.[selectedColorIndex];

  const gallery = product.image_urls?.length > 0 ? product.image_urls : [];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const displayImage = hasColors
    ? selectedColor?.image_url ?? gallery[0]
    : gallery[selectedImageIndex] ?? gallery[0];

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{
        backgroundColor: "#FFF4E6",
      }}
    >
      <main className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 py-16 md:grid-cols-[180px_1fr_1fr] md:gap-10 md:px-16">
        {/* Left: colors */}
        {hasColors && (
          <div className="order-2 flex flex-row flex-wrap justify-center gap-2 md:order-1 md:flex-col md:justify-start">
            <p
              className="mb-1 hidden text-xs uppercase tracking-wide md:block"
              style={{ color: "#35241C", opacity: 0.6 }}
            >
              Color
            </p>
            {product.colors.map((color, index) => (
              <button
                key={color.name}
                onClick={() => setSelectedColorIndex(index)}
                title={color.name}
                className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2"
                style={{
                  borderColor: index === selectedColorIndex ? "#35241C" : "transparent",
                  backgroundColor: color.hex ?? "#ccc",
                }}
              >
                {color.image_url && (
                  <img
                    src={color.image_url}
                    alt={color.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Center: rotating/floating image */}
        <div className="order-1 flex w-full flex-col items-center gap-3 md:order-2">
          <div
            className="flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 4px 16px rgba(255,214,184,0.25)" }}
          >
            {displayImage && (
              <img
                src={displayImage}
                alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ""}`}
                className="h-full w-full object-contain animate-float-rotate"
              />
            )}
          </div>

          {!hasColors && gallery.length > 1 && (
            <div className="flex gap-2">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImageIndex(index)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white"
                  style={{
                    borderColor: index === selectedImageIndex ? "#FF5A36" : "#FFD6B8",
                  }}
                >
                  <img
                    src={url}
                    alt={`${product.name} photo ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="order-3 flex w-full flex-col text-center md:text-left">
          <h1
            className="text-3xl font-bold uppercase tracking-wide md:text-4xl"
            style={{ color: "#35241C" }}
          >
            {product.name}
          </h1>

          {product.size_ml && (
            <p className="mt-2 text-xs uppercase tracking-wide" style={{ color: "#35241C", opacity: 0.6 }}>
              {product.size_ml} ml
            </p>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#35241C", opacity: 0.85 }}>
              {product.description}
            </p>
          )}

          <p className="mt-6 text-2xl font-semibold" style={{ color: "#35241C" }}>
            {product.price} EGP
          </p>

          {/* Scents */}
          {product.scents?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "#35241C", opacity: 0.6 }}>
                Scent: {selectedScent}
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {product.scents.map((scent) => (
                  <button
                    key={scent}
                    onClick={() => setSelectedScent(scent)}
                    className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide"
                    style={{
                      backgroundColor: scent === selectedScent ? "#35241C" : "#ffffff",
                      color: scent === selectedScent ? "#FFF4E6" : "#35241C",
                    }}
                  >
                    {scent}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="mt-8 rounded-full px-8 py-3 font-medium"
            style={{ backgroundColor: "#35241C", color: "#FFF4E6" }}
          >
            Add to Cart
          </button>
        </div>
      </main>
    </div>
  );
}
