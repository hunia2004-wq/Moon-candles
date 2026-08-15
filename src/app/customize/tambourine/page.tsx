"use client";

import { useState, useRef } from "react";

/* TODO: swap in a real product photo once available */


const SIZES = [
  {
    id: "small",
    label: "12 CM",
    price: 90,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/custom%20tambourines/small%20tambourine%20custom.png",
  },
  {
    id: "large",
    label: "20 CM",
    price: 145,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/custom%20tambourines/large%20tambourine%20custom.png",
  },
] as const;

const MAX_MESSAGE_LEN = 50;

type SizeId = (typeof SIZES)[number]["id"];

export default function CustomizeTambourinePage() {
  const [size, setSize] = useState<SizeId>("small");
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
    setPhotoUrl(URL.createObjectURL(file));
  }

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      <div className="grid md:grid-cols-2">
        {/* ---------------- LEFT: form ---------------- */}
        <div className="px-6 md:px-12 py-10 md:py-16 flex flex-col">
          <p className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3" style={{ color: "#DE4B33" }}>
            made by you, for you
          </p>
          <h1 className="font-serif leading-[1.05] mb-4">
            <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
              Customize
            </span>
            <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#DE4B33" }}>
              your tambourine
            </span>
          </h1>
          <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
            Design a tambourine that&apos;s uniquely yours. A photo and a
            message are both optional — add either, both, or neither.
          </p>

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
                <img src={s.img} alt="" className="w-10 h-10 object-contain" />
                <span className="text-xs font-semibold tracking-wide" style={{ color: "#000000" }}>
                  {s.label}
                </span>
                <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.62)" }}>
                  {s.price} LE
                </span>
              </button>
            ))}
          </div>

          <StepLabel n={2} title="Add your photo (optional)" />
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

          <StepLabel n={3} title="Add your message (optional)" />
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

          <div className="flex items-center gap-4 mt-auto">
            <button
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#6E86C7", color: "#FFF4E6" }}
            >
              Preview my tambourine
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
           <img src={selectedSize.img} alt="Your customized tambourine" className="w-full h-auto" />
            <div
              className="mt-4 flex flex-col items-center text-center rounded-2xl overflow-hidden mx-auto"
              style={{
                width: "60%",
                backgroundColor: "#FFF4E6",
                border: "1px solid rgba(0,0,0,0.12)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
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
              <p className="text-[11px] md:text-xs font-medium px-2 py-2 leading-snug" style={{ color: "#DE4B33" }}>
                {message || "your message here"}
              </p>
            </div>
          </div>
        </div>
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
      <span className="uppercase tracking-[0.15em] text-[11px] font-medium" style={{ color: "#000000" }}>
        {title}
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

function TambourineIcon({ large = false }: { large?: boolean }) {
  const s = large ? 56 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
<circle cx="12" cy="12" r="7" strokeDasharray="1.5 3" />
      <circle cx="3.5" cy="9" r="0.8" fill="#DE4B33" stroke="none" />
      <circle cx="3.5" cy="15" r="0.8" fill="#DE4B33" stroke="none" />
      <circle cx="20.5" cy="9" r="0.8" fill="#DE4B33" stroke="none" />
      <circle cx="20.5" cy="15" r="0.8" fill="#DE4B33" stroke="none" />
    </svg>
  );
}