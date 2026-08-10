"use client";

import { useState, useRef } from "react";

const CANDLE_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/melt%20balm%202.png";

/* ------------------------------------------------------------------ */
/* PRODUCT DATA — adjust to match your real catalog */
/* ------------------------------------------------------------------ */

const SIZES = [
  { id: "small", label: "150 ML", grams: "150 ml", price: 450 },
  { id: "large", label: "380 ML", grams: "380 ml", price: 680 },
] as const;

const SCENTS = [
  { id: "vanilla", label: "Vanilla", note: "Warm & Sweet" },
  { id: "sandalwood", label: "Sandalwood", note: "Woody & Calm" },
  { id: "lavender", label: "Lavender", note: "Floral & Soothing" },
  { id: "peony", label: "Peony", note: "Floral & Fresh" },
] as const;

const MAX_MESSAGE_LEN = 50;

/* ------------------------------------------------------------------ */
/* TUNABLE CONSTANTS for the live-preview overlay position, since the  */
/* exact label position depends on the real product photo used. */
/* ------------------------------------------------------------------ */
const LABEL_LEFT_PCT = 30;
const LABEL_TOP_PCT = 40;
const LABEL_WIDTH_PCT = 40;

/* ------------------------------------------------------------------ */

type SizeId = (typeof SIZES)[number]["id"];
type ScentId = (typeof SCENTS)[number]["id"];

export default function CustomizeCandlePage() {
  const [size, setSize] = useState<SizeId>("small");
  const [scent, setScent] = useState<ScentId>("vanilla");
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSize = SIZES.find((s) => s.id === size)!;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose a photo under 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  }

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      <div className="grid md:grid-cols-2">
        {/* ---------------- LEFT: form ---------------- */}
        <div className="px-6 md:px-12 py-10 md:py-16 flex flex-col">
          <p
            className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3"
            style={{ color: "#DE4B33" }}
          >
            made by you, for you
          </p>
          <h1 className="font-serif leading-[1.05] mb-4">
            <span
              className="block text-3xl md:text-5xl font-bold"
              style={{ color: "#000000" }}
            >
              Customize
            </span>
            <span
              className="block text-3xl md:text-5xl font-bold"
              style={{ color: "#DE4B33" }}
            >
              your candle
            </span>
          </h1>
          <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
            Design a candle that&apos;s uniquely yours. Choose the details that
            speak to you and make it meaningful.
          </p>

          {/* Step 1: size */}
          <StepLabel n={1} title="Choose your size" />
          <div className="grid grid-cols-2 gap-3 mb-8">
            {SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 transition-colors"
                style={{
                  border: `1.5px solid ${size === s.id ? "#DE4B33" : "rgba(0,0,0,0.12)"}`,
                  backgroundColor: size === s.id ? "#EFE3C4" : "transparent",
                }}
              >
                <img src={CANDLE_IMG} alt="" className="w-10 h-10 object-contain" />
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: "#000000" }}
                >
                  {s.label}
                </span>
                <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.62)" }}>
                  {s.grams} · {s.price} LE
                </span>
              </button>
            ))}
          </div>

          {/* Step 2: scent */}
          <StepLabel n={2} title="Choose your scent" />
          <div className="grid grid-cols-2 gap-3 mb-8">
            {SCENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScent(s.id)}
                className="flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition-colors"
                style={{
                  border: `1.5px solid ${scent === s.id ? "#DE4B33" : "rgba(0,0,0,0.12)"}`,
                  backgroundColor: scent === s.id ? "#EFE3C4" : "transparent",
                }}
              >
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: "#000000" }}
                >
                  {s.label}
                </span>
                <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.62)" }}>
                  {s.note}
                </span>
              </button>
            ))}
          </div>

          {/* Step 3: photo */}
          <StepLabel n={3} title="Add your photo" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-4 mb-8 text-left transition-colors"
            style={{ border: "1.5px dashed #D8A1AF", backgroundColor: "#EFE3C4" }}
          >
            <PhotoUploadIcon />
            <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
              {photoUrl ? "Photo added — tap to change" : "Upload your photo"}
              <br />
              <span className="text-[11px]">JPG, PNG up to 5MB</span>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Step 4: message */}
          <StepLabel n={4} title="Add your message" />
          <div
            className="rounded-xl px-4 py-3 mb-8"
            style={{ border: "1.5px solid #8FAA82", backgroundColor: "#EFE3C4" }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
              placeholder="Write your message here..."
              rows={3}
              className="w-full bg-transparent outline-none resize-none text-sm"
              style={{ color: "#000000" }}
            />
            <div className="text-right text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>
              {message.length}/{MAX_MESSAGE_LEN}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4 mt-auto">
            <button
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#6E86C7", color: "#FFF4E6" }}
            >
              Preview my candle
              <span aria-hidden>→</span>
            </button>
            <span className="text-lg font-semibold" style={{ color: "#000000" }}>
              {selectedSize.price} LE
            </span>
          </div>
        </div>

        {/* ---------------- RIGHT: live preview ---------------- */}
        <div className="relative min-h-[420px] md:min-h-screen flex items-center justify-center px-6 py-10 md:py-0">
          <div className="relative w-full max-w-md">
            <img
              src={CANDLE_IMG}
              alt="Your customized candle"
              className="w-full h-auto"
            />

            {/* live label overlay: photo + message, composited onto the candle */}
            <div
              className="absolute flex flex-col items-center text-center rounded-t-2xl overflow-hidden"
              style={{
                left: `${LABEL_LEFT_PCT}%`,
                top: `${LABEL_TOP_PCT}%`,
                width: `${LABEL_WIDTH_PCT}%`,
                backgroundColor: "#EFE3C4",
                border: "1px solid rgba(0,0,0,0.12)",
                boxShadow: "0 4px 14px rgba(53,36,28,0.15)",
              }}
            >
              <div
                className="w-full aspect-square flex items-center justify-center"
                style={{ backgroundColor: "#EFE3C4" }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Your photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] px-2" style={{ color: "rgba(0,0,0,0.45)" }}>
                    your photo here
                  </span>
                )}
              </div>
              <p
                className="text-[11px] md:text-xs font-medium px-2 py-2 leading-snug"
                style={{ color: "#DE4B33" }}
              >
                {message || "your message here"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* trust badges */}
      <div
        className="flex flex-wrap justify-center gap-x-10 gap-y-4 px-6 py-6 border-t"
        style={{ borderColor: "rgba(0,0,0,0.12)" }}
      >
        <TrustBadge label="100% soy wax" />
        <TrustBadge label="Handpoured with love" />
        <TrustBadge label="Cruelty free" />
        <TrustBadge label="Clean ingredients, non-toxic & vegan" />
      </div>

      {/* footer strip */}
      <div
        className="flex flex-wrap justify-center gap-x-16 gap-y-3 px-6 py-6 text-xs md:text-sm border-t"
        style={{ borderColor: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.62)" }}
      >
        <p>
          Each candle is handpoured in small batches —{" "}
          <span style={{ color: "#DE4B33" }}>with care, thoughtfully made for you.</span>
        </p>
        <p>Beautifully packaged &amp; ready to gift</p>
      </div>
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold"
        style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
      >
        {n}
      </span>
      <span
        className="uppercase tracking-[0.15em] text-[11px] font-medium"
        style={{ color: "#000000" }}
      >
        {title}
      </span>
    </div>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5">
        <path d="M12 3c-4 3-7 6-7 10a7 7 0 0014 0c0-4-3-7-7-10Z" />
      </svg>
      <span className="text-[11px] md:text-xs uppercase tracking-wide" style={{ color: "#000000" }}>
        {label}
      </span>
    </div>
  );
}

function PhotoUploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="#DE4B33" stroke="none" />
      <path d="M21 16l-5.5-5.5L9 17" />
    </svg>
  );
}