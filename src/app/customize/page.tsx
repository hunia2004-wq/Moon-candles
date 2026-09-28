"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import CandleLabelWrap, { LABEL_FONTS } from "../components/CandleLabelWrap";
import LabelPlaceholder from "../components/LabelPlaceholder";

// Static "how it looks in real life" photo shown under the preview —
// not user-editable, just a fixed reference image.

const SIZES = [
  {
    id: "small",
    label: "150 ML",
    grams: "150 ml",
    price: 450,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/150ml.png?v=2",
    reference: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20150.png",
  },
  {
    id: "large",
    label: "380 ML",
    grams: "380 ml",
    price: 680,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/380ml.png",
    reference: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20380.png",
  },
] as const;

const MAX_MESSAGE_LEN = 50;

type SizeId = (typeof SIZES)[number]["id"];
type Point = { x: number; y: number }; // stored as % of the candle image's box

export default function CustomizeCandlePage() {
  const [size, setSize] = useState<SizeId>("small");
  const [scent, setScent] = useState<string>("");
  const [scents, setScents] = useState<string[]>([]);
  const [message, setMessage] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fontId, setFontId] = useState<string>(LABEL_FONTS[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const selectedSize = SIZES.find((s) => s.id === size)!;

  useEffect(() => {
    async function loadScents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("scents")
        .not("scents", "is", null)
        .limit(1)
        .single();
      if (error) {
        console.error("Failed to load scents:", error.message);
        return;
      }
      if (data?.scents?.length) {
        setScents(data.scents);
        setScent(data.scents[0]);
      }
    }
    loadScents();
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose a photo under 5MB.");
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
    
  }

  function scrollToPreview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }



  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
                 {/* ---------------- TOP: live preview, curved/wrapped ---------------- */}
      <div ref={previewRef} className="relative flex items-center justify-center px-6 pt-2 pb-4">
 <CandleLabelWrap
  size={selectedSize}
  candleImg={selectedSize.img}
  photoUrl={photoUrl}
  message={message}
  onMessageChange={setMessage}
  onPhotoZoneClick={() => fileInputRef.current?.click()}
  fontId={fontId}
  onFontChange={setFontId}
  maxLen={MAX_MESSAGE_LEN}
/>
</div>
         
      {/* ---------------- BELOW: form ---------------- */}
      <div className="px-6 md:px-12 py-4 md:py-16 flex flex-col max-w-2xl mx-auto">
        <p className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3" style={{ color: "#DE4B33" }}>
          made by you, for you
        </p>
        <h1 className="font-serif leading-[1.05] mb-4">
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customize
          </span>
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#DE4B33" }}>
            your candle
          </span>
        </h1>
        <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
          If you have any questions or would like something other than the options provided, feel free to DM us on Instagram @the_moon_candlesshop.
        </p>

        <StepLabel n={1} title="Choose your size" />
        <div className="grid grid-cols-2 gap-3 mb-8">
          {SIZES.map((s) => (
            <button
  key={s.id}
  onClick={() => setSize(s.id)}
  className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md"
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

        <StepLabel n={2} title="Choose your scent" />
        <div className="grid grid-cols-2 gap-3 mb-8">
          {scents.length === 0 && (
            <p className="col-span-2 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
              Loading scents...
            </p>
          )}
          {scents.map((s) => (
            <button
              key={s}
              onClick={() => setScent(s)}
              className="flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition-colors"
              style={{
                border: `1.5px solid ${scent === s ? "#DE4B33" : "rgba(0,0,0,0.12)"}`,
                backgroundColor: scent === s ? "#EFE3C4" : "transparent",
              }}
            >
              <span className="text-xs font-semibold tracking-wide" style={{ color: "#000000" }}>
                {s}
              </span>
            </button>
          ))}
        </div>

       
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handlePhotoChange}
        />

     

        <div className="flex items-center gap-4 mt-auto">
          <button
  onClick={() => setShowPreview(true)}
  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors bg-[#DE4B33] hover:bg-[#B23A26] active:bg-[#B23A26]"
  style={{
    color: "#FFF4E6",
    fontSize: "clamp(14px, 1.5vw, 16px)",
    padding: "clamp(10px, 0.9vw, 12px) clamp(20px, 2.2vw, 32px)",
  }}
>
  Preview my candle
</button>
          <span className="text-lg font-semibold" style={{ color: "#000000" }}>
            {selectedSize.price} LE
          </span>
        </div>
      </div>
      {showPreview && (
  <div
    className="fixed inset-0 z-[999] overflow-y-auto px-6 py-10"
    style={{ backgroundColor: "#FFF4E6" }}
  >
    <button
      type="button"
      onClick={() => setShowPreview(false)}
      className="fixed top-6 right-6 text-2xl"
      style={{ color: "#000000" }}
      aria-label="Close"
    >
      ✕
    </button>

    <div className="m-auto flex flex-col items-center w-full max-w-md min-h-full justify-center">
      {/* Candle alone */}
      <img src={selectedSize.img} alt="" className="w-48 md:w-56 object-contain" />

      {/* Placeholder beneath it: message left, photo right, fully editable */}
      <div className="mt-6 w-full flex justify-center">
        <LabelPlaceholder
          message={message}
          onMessageChange={setMessage}
          photoUrl={photoUrl}
          onPhotoClick={() => fileInputRef.current?.click()}
                   maxLen={MAX_MESSAGE_LEN}
          fontFamily={LABEL_FONTS.find((f) => f.id === fontId)?.family}
        />
      </div>

      {/* Reference photo, hidden until a real URL is set */}
           {/* Reference photo for the selected size */}
      {selectedSize.reference && (
        <>
          <p className="mt-8 mb-2 text-xs uppercase tracking-[0.15em]" style={{ color: "rgba(0,0,0,0.62)" }}>
            This is how it will look in real life
          </p>
          <img src={selectedSize.reference} alt="How it looks in real life" className="w-full rounded-xl" />
        </>
      )}

      <button
        onClick={() => {
          // TODO: wire this up to your actual checkout/cart flow once ready
          console.log("Add custom candle to cart", { size, scent, message, photoUrl });
        }}
        className="mt-6 inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full text-sm md:text-base font-medium transition-colors bg-[#DE4B33] hover:bg-[#B23A26] active:bg-[#B23A26]"
        style={{ color: "#FFF4E6" }}
      >
        Checkout — {selectedSize.price} LE
      </button>
       </div>
  </div>
)}
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