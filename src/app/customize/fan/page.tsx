"use client";

import { useState, useRef } from "react";

/* TODO: swap in a real product photo once available */
const PRODUCT_IMG: string | null = null;

const FAN_PRICE = 25;
const MAX_MESSAGE_LEN = 50;

export default function CustomizeFanPage() {
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              your fan
            </span>
          </h1>
          <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
            Design a fan that&apos;s uniquely yours. A photo and a message are
            both optional — add either, both, or neither.
          </p>

          <StepLabel n={1} title="Add your photo (optional)" />
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

          <StepLabel n={2} title="Add your message (optional)" />
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
              Preview my fan
              <span aria-hidden>→</span>
            </button>
            <span className="text-lg font-semibold" style={{ color: "#000000" }}>
              {FAN_PRICE} LE
            </span>
          </div>
        </div>

        {/* ---------------- RIGHT: live preview ---------------- */}
        <div className="relative min-h-[420px] md:min-h-screen flex items-center justify-center px-6 py-10 md:py-0">
          <div className="relative w-full max-w-md">
            {PRODUCT_IMG ? (
              <img src={PRODUCT_IMG} alt="Your customized fan" className="w-full h-auto" />
            ) : (
              <div
                className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-2"
                style={{ backgroundColor: "#EFE3C4", border: "1px dashed rgba(0,0,0,0.2)" }}
              >
                <FanIcon large />
                <span className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
                  product photo coming soon
                </span>
              </div>
            )}

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

function FanIcon({ large = false }: { large?: boolean }) {
  const s = large ? 56 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.4">
      <path d="M12 21V10" />
      <path d="M12 10c0-4-3-7-7-7 0 4 3 7 7 7Z" />
      <path d="M12 10c0-4 3-7 7-7 0 4-3 7-7 7Z" />
      <path d="M12 10c-4 0-7 3-7 7 4 0 7-3 7-7Z" />
      <path d="M12 10c4 0 7 3 7 7-4 0-7-3-7-7Z" />
    </svg>
  );
}