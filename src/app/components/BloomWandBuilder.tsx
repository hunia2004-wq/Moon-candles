"use client";

import { useState, useRef } from "react";
import type { Product } from "@/lib/supabase/types";

type OrderLine = {
  id: string;
  colorName: string;
  optionName: string;
  price: number;
  quantity: number;
  image: string;
  photoUrl?: string;
};

type UploadedPhoto = {
  id: string;
  url: string;
};

const ACCENT = "#6E86C7";
const ACCENT_DARK = "#5A70B0";

export default function BloomWandBuilder({ product }: { product: Product }) {
  const colors = product.colors ?? [];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedColor = colors[selectedColorIndex];
  const selectedOption = selectedColor?.options?.[selectedOptionIndex];
  const isWithPhoto = selectedOption?.name === "With Photo";

  const previewImage =
    selectedOption?.image_urls?.[0] ??
    selectedOption?.image_url ??
    selectedColor?.image_url;

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: UploadedPhoto[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
    }));

    setUploadedPhotos((prev) => [...prev, ...newPhotos]);

    // Auto-select the first newly uploaded photo, if nothing's selected yet
    if (!selectedPhotoId && newPhotos.length > 0) {
      setSelectedPhotoId(newPhotos[0].id);
    }
  }

  function addLine() {
    if (!selectedColor || !selectedOption) return;
    const chosenPhoto = uploadedPhotos.find((p) => p.id === selectedPhotoId);

    setOrderLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        colorName: selectedColor.name,
        optionName: selectedOption.name,
        price: selectedOption.price ?? 0,
        quantity,
        image: previewImage ?? "",
        photoUrl: isWithPhoto ? chosenPhoto?.url : undefined,
      },
    ]);
    setQuantity(1);
  }

  function removeLine(id: string) {
    setOrderLines((prev) => prev.filter((line) => line.id !== id));
  }

  // Assigns one specific uploaded photo to EVERY existing "With Photo"
  // line in the order at once, overwriting whatever was there before.
  function applyPhotoToAll(photoUrl: string) {
    setOrderLines((prev) =>
      prev.map((line) =>
        line.optionName === "With Photo" ? { ...line, photoUrl } : line
      )
    );
  }

  const totalQuantity = orderLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalPrice = orderLines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  function handleAddToCart() {
    // TODO: wire this up to your real cart store once it exists
    console.log("Bloom Wand order:", orderLines);
  }

  return (
    <div className="flex flex-1 flex-col items-center font-sans" style={{ backgroundColor: "#efe3c4" }}>
      <main className="w-full max-w-3xl px-6 py-16 md:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
          build your own
        </p>
        <h1 className="mt-2 text-3xl font-bold uppercase tracking-wide md:text-4xl" style={{ color: "#000000" }}>
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#000000", opacity: 0.75 }}>
            {product.description}
          </p>
        )}

        {/* --- Photo upload section --- */}
        <div className="mt-6 rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
            Your photos
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mb-4 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
            style={{ backgroundColor: "#efe3c4", color: "#000000" }}
          >
            + Upload photo(s)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handlePhotosChange}
          />

          {uploadedPhotos.length === 0 && (
            <p className="text-xs" style={{ color: "#000000", opacity: 0.5 }}>
              No photos uploaded yet.
            </p>
          )}

          {uploadedPhotos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {uploadedPhotos.map((photo) => {
                const isSelected = photo.id === selectedPhotoId;
                return (
                  <div key={photo.id} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setSelectedPhotoId(photo.id)}
                      className="h-16 w-16 overflow-hidden rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                      style={{ borderColor: isSelected ? ACCENT : "transparent" }}
                    >
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      onClick={() => applyPhotoToAll(photo.url)}
                      className="text-[10px] font-medium underline transition-opacity hover:opacity-70"
                      style={{ color: ACCENT }}
                    >
                      apply to all
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- Builder card --- */}
        <div
          className="mt-6 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:p-8"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 12px 30px rgba(110,134,199,0.1)" }}
        >
          {/* Live preview */}
          <div className="flex w-full flex-shrink-0 items-center justify-center md:w-48">
            <div
              className="flex aspect-square w-full items-center justify-center rounded-2xl p-4"
              style={{ backgroundColor: "#efe3c4" }}
            >
              {previewImage && (
                <img src={previewImage} alt="" className="h-full w-full object-contain" />
              )}
            </div>
          </div>

          {/* Selectors */}
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Color
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {colors.map((color, index) => {
                const swatchImg = color.options?.[0]?.image_url ?? color.image_url;
                const isSelected = index === selectedColorIndex;
                return (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColorIndex(index);
                      setSelectedOptionIndex(0);
                    }}
                    title={color.name}
                    className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95"
                    style={{
                      borderColor: isSelected ? ACCENT : "transparent",
                      backgroundColor: color.hex ?? "#ccc",
                    }}
                  >
                    {swatchImg && <img src={swatchImg} alt={color.name} className="h-full w-full object-cover" />}
                  </button>
                );
              })}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Option
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedColor?.options?.map((option, index) => {
                const isSelected = index === selectedOptionIndex;
                return (
                  <button
                    key={option.name}
                    onClick={() => setSelectedOptionIndex(index)}
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      backgroundColor: isSelected ? ACCENT : "#FFFFFF",
                      color: isSelected ? "#FFF4E6" : ACCENT,
                      border: `1px solid ${ACCENT}`,
                    }}
                  >
                    {option.name} · {option.price} EGP
                  </button>
                );
              })}
            </div>

            {/* Photo picker — only shown when "With Photo" is selected */}
            {isWithPhoto && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                  Photo for this wand
                </p>
                {uploadedPhotos.length === 0 ? (
                  <p className="text-xs" style={{ color: "#000000", opacity: 0.5 }}>
                    Upload a photo above first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {uploadedPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhotoId(photo.id)}
                        className="h-12 w-12 overflow-hidden rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{ borderColor: photo.id === selectedPhotoId ? ACCENT : "transparent" }}
                      >
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Quantity
            </p>
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-full text-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ backgroundColor: "#efe3c4", color: "#000000" }}
              >
                −
              </button>
              <span className="w-8 text-center text-base font-semibold" style={{ color: "#000000" }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-9 w-9 rounded-full text-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ backgroundColor: "#efe3c4", color: "#000000" }}
              >
                +
              </button>
            </div>

            <button
              onClick={addLine}
              disabled={isWithPhoto && uploadedPhotos.length === 0}
              className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100"
              style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
            >
              + Add to order
            </button>
          </div>
        </div>

        {/* --- Running order list --- */}
        {orderLines.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Your order
            </p>
            <div className="flex flex-col gap-2">
              {orderLines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex items-center gap-3">
                    {line.image && (
                      <img src={line.image} alt="" className="h-10 w-10 rounded-lg object-contain" style={{ backgroundColor: "#efe3c4" }} />
                    )}
                    {line.photoUrl && (
                      <img src={line.photoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <span className="text-sm" style={{ color: "#000000" }}>
                      {line.quantity}× {line.colorName} — {line.optionName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold" style={{ color: ACCENT }}>
                      {line.price * line.quantity} EGP
                    </span>
                    <button
                      onClick={() => removeLine(line.id)}
                      className="text-xs font-medium underline transition-opacity hover:opacity-70"
                      style={{ color: "#000000", opacity: 0.5 }}
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-4"
              style={{ backgroundColor: "#efe3c4" }}
            >
              <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                {totalQuantity} wand{totalQuantity !== 1 ? "s" : ""} total
              </span>
              <span className="text-lg font-bold" style={{ color: ACCENT }}>
                {totalPrice} EGP
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="mt-4 w-full rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
            >
              Add order to Cart
            </button>
          </div>
        )}
      </main>
    </div>
  );
}