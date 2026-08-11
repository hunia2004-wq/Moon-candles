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

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [selectedScent, setSelectedScent] = useState<string | null>(
    product.scents?.[0] ?? null
  );

  const hasColors = product.colors?.length > 0;
  const selectedColor = product.colors?.[selectedColorIndex];

  const gallery = hasColors
    ? product.colors.map((color) => color.image_url).filter(Boolean)
    : product.image_urls ?? [];

  const displayImage = gallery[selectedImageIndex] ?? gallery[0];

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <main className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 py-16 md:grid-cols-[180px_1fr_1fr] md:gap-10 md:px-16">

        {/* Left: options for products with colors */}
        {hasColors && (
          <div className="order-2 flex flex-row flex-wrap justify-center gap-2 md:order-1 md:flex-col md:justify-start">
            <p
              className="mb-1 hidden text-xs uppercase tracking-wide md:block"
              style={{ color: "#000000", opacity: 0.6 }}
            >
              Options
            </p>

            {product.colors.map((color, index) => (
              <button
                key={color.name}
                onClick={() => {
                  setSelectedColorIndex(index);
                  setSelectedImageIndex(index);
                }}
                title={color.name}
                className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  borderColor: index === selectedColorIndex ? "#47684b" : "transparent",
                  backgroundColor: color.hex ?? "#ccc",
                }}
              >
                {color.image_url && (
                  <img src={color.image_url} alt={color.name} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Center: name + main image */}
        <div className="order-1 flex w-full flex-col items-center gap-3 md:order-2">
          <h1
            className="text-2xl font-bold uppercase tracking-wide text-center md:text-3xl"
            style={{ color: "#000000" }}
          >
            {product.name}
          </h1>

         <div className="flex aspect-square w-full max-w-sm items-center justify-center">
            {displayImage && (
              <img
                src={displayImage}
                alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ""}`}
                className="h-full w-full object-contain"
              />
            )}
          </div>

          {/* Image thumbnails */}
          {!hasColors && gallery.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    if (hasColors) setSelectedColorIndex(index);
                  }}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: index === selectedImageIndex ? "#47684b" : "#8FAA82",
                  }}
                >
                  <img
                    src={url}
                    alt={`${product.name} option ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Selected option name */}
          {hasColors && selectedColor && (
            <p className="text-xs uppercase tracking-wide" style={{ color: "#000000", opacity: 0.65 }}>
              {selectedColor.name}
            </p>
          )}
        </div>

        {/* Right: details */}
        <div className="order-3 flex w-full flex-col text-center md:text-left">
          {product.size_ml && (
            <p className="text-xs uppercase tracking-wide" style={{ color: "#000000", opacity: 0.6 }}>
              {product.size_ml} ml
            </p>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#000000", opacity: 0.75 }}>
              {product.description}
            </p>
          )}

          <p className="mt-6 text-2xl font-semibold" style={{ color: "#47684b" }}>
            {product.price} EGP
          </p>

          {/* Scents */}
          {product.scents?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "#000000", opacity: 0.6 }}>
                Scent: {selectedScent}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.scents.map((scent) => (
                  <button
  key={scent}
  onClick={() => setSelectedScent(scent)}
  className={`rounded-full px-3 py-2 text-xs font-medium uppercase tracking-wide text-center transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
    scent === selectedScent
      ? "bg-[#8FAA82] hover:bg-[#7C966F] active:bg-[#7C966F]"
      : "bg-white hover:bg-[#EFE3C4]"
  }`}
  style={{
    color: scent === selectedScent ? "#FFF4E6" : "#000000",
    border: scent === selectedScent ? "none" : "1px solid #8FAA82",
  }}
>
  {scent}
</button>
                ))}
              </div>
            </div>
          )}

          <button
            className="mt-8 rounded-full px-8 py-3 font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
            style={{ backgroundColor: "#47684b", color: "#FFF4E6" }}
          >
            Add to Cart
          </button>
        </div>
      </main>
    </div>
  );
}