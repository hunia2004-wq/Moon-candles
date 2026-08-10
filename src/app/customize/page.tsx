"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const SIZES = [
  {
    id: "small",
    label: "150 ML",
    grams: "150 ml",
    price: 450,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/150ml.png",
  },
  {
    id: "large",
    label: "380 ML",
    grams: "380 ml",
    price: 680,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/380ml.png",
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
  const [photoScale, setPhotoScale] = useState(1);
  const [photoPos, setPhotoPos] = useState<Point>({ x: 50, y: 42 });
  const [textPos, setTextPos] = useState<Point>({ x: 50, y: 62 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<"photo" | "text" | null>(null);
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
    setPhotoScale(1);
  }

  function scrollToPreview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // --- Drag handling, shared for both the photo and the text ---
  const handlePointerDown = useCallback((target: "photo" | "text") => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragTarget.current = target;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    if (dragTarget.current === "photo") setPhotoPos({ x: xPct, y: yPct });
    if (dragTarget.current === "text") setTextPos({ x: xPct, y: yPct });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragTarget.current = null;
  }, []);

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      {/* ---------------- TOP: live, draggable preview ---------------- */}
      <div ref={previewRef} className="relative flex items-center justify-center px-6 py-6">
        <div
          ref={stageRef}
          className="relative w-full max-w-[180px] md:max-w-[300px] touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <img src={selectedSize.img} alt="Your customized candle" className="w-full h-auto pointer-events-none" />

          {/* Photo — draggable, croppable via zoom slider, no background box
              once a real photo is added (so it reads as printed, not pasted) */}
          {photoUrl ? (
            <div
              onPointerDown={handlePointerDown("photo")}
              className="absolute rounded-md overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                left: `${photoPos.x}%`,
                top: `${photoPos.y}%`,
                width: "34%",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 2px 8px rgba(53,36,28,0.25)",
              }}
            >
              <img
                src={photoUrl}
                alt="Your photo"
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: `scale(${photoScale})` }}
              />
            </div>
          ) : (
            <div
              className="absolute flex items-center justify-center rounded-md"
              style={{
                left: `${photoPos.x}%`,
                top: `${photoPos.y}%`,
                width: "34%",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                border: "1.5px dashed rgba(0,0,0,0.3)",
              }}
            >
              <span className="text-[9px] text-center px-1" style={{ color: "rgba(0,0,0,0.4)" }}>
                photo goes here
              </span>
            </div>
          )}

          {/* Message — draggable text, no box, sits directly on the label
              area like real printed text */}
          <p
            onPointerDown={handlePointerDown("text")}
            className="absolute text-center px-1 cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${textPos.x}%`,
              top: `${textPos.y}%`,
              transform: "translate(-50%, -50%)",
              width: "40%",
              fontSize: "11px",
              fontWeight: 600,
              color: message ? "#8FAA82" : "rgba(0,0,0,0.35)",
              textShadow: "0 1px 2px rgba(255,255,255,0.6)",
            }}
          >
            {message || "drag me · your message"}
          </p>
        </div>
      </div>

      {/* Zoom control for the photo, only shown once a photo exists */}
      {photoUrl && (
        <div className="flex items-center justify-center gap-3 px-6 pb-4">
          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.05}
            value={photoScale}
            onChange={(e) => setPhotoScale(Number(e.target.value))}
            className="w-40"
          />
        </div>
      )}
      <p className="text-center text-[11px] mb-4" style={{ color: "rgba(0,0,0,0.4)" }}>
        Drag your photo and message to place them exactly where you like
      </p>

      {/* ---------------- BELOW: form ---------------- */}
      <div className="px-6 md:px-12 py-10 md:py-16 flex flex-col max-w-2xl mx-auto">
        <p className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3" style={{ color: "#8FAA82" }}>
          made by you, for you
        </p>
        <h1 className="font-serif leading-[1.05] mb-4">
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customize
          </span>
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#8FAA82" }}>
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
    border: `1.5px solid ${size === s.id ? "#8FAA82" : "rgba(0,0,0,0.12)"}`,
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
                border: `1.5px solid ${scent === s ? "#8FAA82" : "rgba(0,0,0,0.12)"}`,
                backgroundColor: scent === s ? "#EFE3C4" : "transparent",
              }}
            >
              <span className="text-xs font-semibold tracking-wide" style={{ color: "#000000" }}>
                {s}
              </span>
            </button>
          ))}
        </div>

        <StepLabel n={3} title="Add your photo" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-4 mb-8 text-left transition-colors"
          style={{ border: "1.5px dashed #8FAA82", backgroundColor: "#EFE3C4" }}
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

        <div className="flex items-center gap-4 mt-auto">
          <button
  onClick={() => setShowPreview(true)}
  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-opacity hover:opacity-90"
  style={{ backgroundColor: "#8FAA82", color: "#FFF4E6" }}
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
    className="fixed inset-0 z-[999] flex flex-col items-center justify-center px-6"
    style={{ backgroundColor: "#FFF4E6" }}
  >
    <button
      onClick={() => setShowPreview(false)}
      className="absolute top-6 right-6 text-2xl"
      style={{ color: "#000000" }}
      aria-label="Close"
    >
      ✕
    </button>

    <div className="relative w-full max-w-sm md:max-w-md">
      <img src={selectedSize.img} alt="Your customized candle" className="w-full h-auto" />

      {photoUrl && (
        <div
          className="absolute rounded-md overflow-hidden"
          style={{
            left: `${photoPos.x}%`,
            top: `${photoPos.y}%`,
            width: "34%",
            aspectRatio: "1 / 1",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 2px 8px rgba(53,36,28,0.25)",
          }}
        >
          <img
            src={photoUrl}
            alt="Your photo"
            className="w-full h-full object-cover"
            style={{ transform: `scale(${photoScale})` }}
          />
        </div>
      )}

      <p
        className="absolute text-center px-1"
        style={{
          left: `${textPos.x}%`,
          top: `${textPos.y}%`,
          transform: "translate(-50%, -50%)",
          width: "40%",
          fontSize: "13px",
          fontWeight: 600,
          color: "#8FAA82",
          textShadow: "0 1px 2px rgba(255,255,255,0.6)",
        }}
      >
        {message}
      </p>
    </div>

<button
  onClick={() => {
    // TODO: wire this up to your actual checkout/cart flow once ready
    console.log("Add custom candle to cart", { size, scent, message, photoUrl, photoPos, textPos, photoScale });
  }}
  className="mt-6 inline-flex items-center justify-center gap-2 px-10 py-3 rounded-full text-sm md:text-base font-medium transition-opacity hover:opacity-90"
  style={{ backgroundColor: "#8FAA82", color: "#FFF4E6" }}
>
  Checkout — {selectedSize.price} LE
  
</button>
    
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
        style={{ backgroundColor: "#8FAA82", color: "#FFF4E6" }}
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FAA82" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="#8FAA82" stroke="none" />
      <path d="M21 16l-5.5-5.5L9 17" />
    </svg>
    
  );
}