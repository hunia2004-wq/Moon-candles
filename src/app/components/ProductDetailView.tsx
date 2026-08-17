"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase/types";

// Same list used in ShopGrid.tsx to identify giveaway products by name.
const GIVEAWAY_NAMES = [
  "Mini Candles",
  "Quack and Kiss",
  "Plain tambourine",
  "Fan",
  "Bloom Wand",
];

// Products that have a dedicated customization flow. Maps the exact
// product name (as stored in Supabase) to its customize route.
const CUSTOMIZE_ROUTES: Record<string, string> = {
  "Plain tambourine": "/customize/tambourine",
  "Fan": "/customize/fan",
  "Mini Candles": "/customize-mini",
};
// Products that can ONLY be customized — no plain "Add to Cart" option.
const CUSTOMIZE_ONLY_NAMES = ["Fan", "Mini Candles"];

export default function ProductDetailView({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedColor = searchParams.get("color");
  const isGiveaway = GIVEAWAY_NAMES.includes(product.name);
  const accent = isGiveaway ? "#6E86C7" : "#D8A1AF";
  const accentDark = isGiveaway ? "#5A70B0" : "#B5798A";

  const customizeRoute = CUSTOMIZE_ROUTES[product.name];
  const customizeOnly = CUSTOMIZE_ONLY_NAMES.includes(product.name);

  const initialColorIndex = Math.max(
    0,
    product.colors?.findIndex((c) => c.name === preselectedColor) ?? 0
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(
    initialColorIndex === -1 ? 0 : initialColorIndex
  );

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [selectedScent, setSelectedScent] = useState<string | null>(
    product.scents?.[0] ?? null
  );

  const hasColors = product.colors?.length > 0;
  const selectedColor = product.colors?.[selectedColorIndex];
  const hasOptions = !!selectedColor?.options?.length;
  const selectedOption = hasOptions
    ? selectedColor!.options![selectedOptionIndex]
    : undefined;

  useEffect(() => {
    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  const displayPrice = selectedOption?.price ?? selectedColor?.price ?? product.price;

  const gallery = hasOptions
    ? selectedOption?.image_urls?.length
      ? selectedOption.image_urls
      : [selectedOption?.image_url].filter(Boolean)
    : hasColors
    ? selectedColor?.image_urls?.length
      ? selectedColor.image_urls
      : [selectedColor?.image_url].filter(Boolean)
    : product.image_urls ?? [];

  const displayImage = gallery[selectedImageIndex] ?? gallery[0];

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <main className="grid w-full max-w-6xl grid-cols-1 items-start gap-8 px-6 py-16 md:grid-cols-[180px_1fr_1fr] md:gap-10 md:px-16">

        {hasColors && (
          <div className="order-2 flex flex-row flex-wrap justify-center gap-2 md:order-1 md:flex-col md:justify-start md:pt-24">
            <p
              className="mb-1 hidden text-xs font-semibold uppercase tracking-[0.15em] md:block"
              style={{ color: accent }}
            >
              Options
            </p>

            {product.colors.map((color, index) => {
              const swatchImg = color.options?.[0]?.image_url ?? color.image_url;
              return (
                <button
                  key={color.name}
                  onClick={() => setSelectedColorIndex(index)}
                  title={color.name}
                  className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 shadow-sm transition-all duration-150 hover:scale-110 active:scale-95"
                  style={{
                    borderColor: index === selectedColorIndex ? accent : "transparent",
                    backgroundColor: color.hex ?? "#ccc",
                    boxShadow:
                      index === selectedColorIndex
                        ? "0 0 0 3px rgba(71,104,75,0.15)"
                        : "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {swatchImg && (
                    <img src={swatchImg} alt={color.name} className="h-full w-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="order-1 flex w-full flex-col items-center gap-3 md:order-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            Handpoured With Love
          </p>

          <h1
            className="text-center text-2xl font-bold uppercase leading-tight tracking-wide md:text-4xl"
            style={{ color: "#000000" }}
          >
            {product.name}
          </h1>

          <div className="relative flex aspect-square w-full max-w-sm items-center justify-center">
            <div
              className="absolute h-[80%] w-[80%] rounded-full opacity-60 blur-3xl"
              style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
            />

            <div
              className="relative flex h-full w-full items-center justify-center rounded-3xl p-6"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 20px 40px rgba(70,85,61,0.15)",
              }}
            >
              {displayImage && (
                <img
                  src={displayImage}
                  alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ""}`}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setSelectedImageIndex(index)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: index === selectedImageIndex ? accent : "transparent",
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

          {hasColors && selectedColor && (
            <span
              className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "#FFFFFF", color: accent }}
            >
              {selectedColor.name}
            </span>
          )}

          {hasOptions && (
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {selectedColor!.options!.map((option, index) => {
                const isSelected = index === selectedOptionIndex;
                return (
                  <button
                    key={option.name}
                    onClick={() => {
                      setSelectedOptionIndex(index);
                      setSelectedImageIndex(0);
                    }}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? accent : "#FFFFFF",
                      color: isSelected ? "#FFF4E6" : accent,
                      border: `1px solid ${accent}`,
                    }}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="order-3 flex w-full flex-col rounded-3xl p-6 text-center md:p-8 md:text-left"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 12px 30px rgba(110,134,199,0.08)" }}
        >
          {product.size_ml && (
            <span
              className="self-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide md:self-start"
              style={{ backgroundColor: "#efe3c4", color: accent }}
            >
              {product.size_ml} ml
            </span>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#000000", opacity: 0.75 }}>
              {product.description}
            </p>
          )}

          <p className="mt-6 text-3xl font-bold" style={{ color: accent }}>
            {displayPrice} <span className="text-lg font-medium">EGP</span>
          </p>

          <div className="mt-4 h-px w-full" style={{ backgroundColor: "#efe3c4" }} />

          {product.scents?.length > 0 && !customizeOnly && (
            <div className="mt-6">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: accent }}
              >
                Scent: {selectedScent}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.scents.map((scent) => {
                  const isSelected = scent === selectedScent;
                  return (
                    <button
                      key={scent}
                      onClick={() => setSelectedScent(scent)}
                      className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-wide text-center transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        backgroundColor: isSelected ? accent : "#ffffff",
                        color: isSelected ? "#FFF4E6" : "#000000",
                        border: isSelected ? "none" : `1px solid ${accent}`,
                      }}
                      onMouseEnter={(e) => {
                        if (isSelected) e.currentTarget.style.backgroundColor = accentDark;
                        else e.currentTarget.style.backgroundColor = "#EFE3C4";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? accent : "#ffffff";
                      }}
                    >
                      {scent}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart — hidden entirely for customize-only products
              like Fan, which can't be purchased plain. */}
          {!customizeOnly && (
            <button
              className="mt-8 rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
              style={{ backgroundColor: accent, color: "#FFF4E6" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent)}
            >
              Add to Cart
            </button>
          )}

          {/* Customize Your Own — shown for any product with a mapped
              customize route (Tambourine, Fan). Outline style when Add
              to Cart is also present, filled/primary when it's the only
              option (Fan). */}
          {customizeRoute && (
            <button
              onClick={() => router.push(customizeRoute)}
              className={`rounded-full px-8 py-3.5 text-base font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                customizeOnly ? "mt-8 shadow-md" : "mt-3"
              }`}
              style={
                customizeOnly
                  ? { backgroundColor: accent, color: "#FFF4E6" }
                  : { backgroundColor: "transparent", color: accent, border: `1.5px solid ${accent}` }
              }
            >
              Customize Your candle
            </button>
          )}
        </div>
      </main>
    </div>
  );
}