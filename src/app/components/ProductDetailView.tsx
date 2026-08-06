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

  // When the product has colors, the color's own photo drives the main image.
  // When it doesn't, fall back to a browsable gallery of image_urls.
  const gallery = product.image_urls?.length > 0 ? product.image_urls : [];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const displayImage = hasColors
    ? selectedColor?.image_url ?? gallery[0]
    : gallery[selectedImageIndex] ?? gallery[0];

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{
        background: "linear-gradient(to bottom, #C77486 0%, #F4E1D2 40%, #F4E1D2 100%)",
      }}
    >
      <main className="flex w-full max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:px-16">
        {/* Image */}
        <div className="flex w-full flex-col items-center gap-3 md:w-1/2">
          <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-2xl bg-white p-6">
            {displayImage && (
              <img
                src={displayImage}
                alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ""}`}
                className="h-full w-full object-contain"
              />
            )}
          </div>

          {/* Thumbnail gallery — only relevant when there's no color-driven image and multiple photos exist */}
          {!hasColors && gallery.length > 1 && (
            <div className="flex gap-2">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImageIndex(index)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white"
                  style={{
                    borderColor: index === selectedImageIndex ? "#5E3A4D" : "transparent",
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

        {/* Details */}
        <div className="flex w-full flex-col md:w-1/2">
          <h1
            className="text-3xl font-bold uppercase tracking-wide md:text-4xl"
            style={{ color: "#5E3A4D" }}
          >
            {product.name}
          </h1>

          {product.size_ml && (
            <p className="mt-2 text-xs uppercase tracking-wide" style={{ color: "#5E3A4D", opacity: 0.6 }}>
              {product.size_ml} ml
            </p>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#5E3A4D", opacity: 0.85 }}>
              {product.description}
            </p>
          )}

          <p className="mt-6 text-2xl font-semibold" style={{ color: "#5E3A4D" }}>
            {product.price} EGP
          </p>

          {/* Colors */}
          {hasColors && (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "#5E3A4D", opacity: 0.6 }}>
                Color: {selectedColor?.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColorIndex(index)}
                    title={color.name}
                    className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2"
                    style={{
                      borderColor: index === selectedColorIndex ? "#5E3A4D" : "transparent",
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
            </div>
          )}

          {/* Scents */}
          {product.scents?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: "#5E3A4D", opacity: 0.6 }}>
                Scent: {selectedScent}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.scents.map((scent) => (
                  <button
                    key={scent}
                    onClick={() => setSelectedScent(scent)}
                    className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide"
                    style={{
                      backgroundColor: scent === selectedScent ? "#5E3A4D" : "#ffffff",
                      color: scent === selectedScent ? "#F4E1D2" : "#5E3A4D",
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
            style={{ backgroundColor: "#5E3A4D", color: "#F4E1D2" }}
          >
            Add to Cart
          </button>
        </div>
      </main>
    </div>
  );
}