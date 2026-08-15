"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  "Light Green", "Dark Green", "Purple", "Orange", "Red", "Yellow",
  "Pink", "Rose", "Light Purple", "White", "Light Blue", "Dark Blue",
  "Brown", "Black",
];

const PRICE_PER_CANDLE = 85; // adjust if the real mini candle price differs
const MAX_MESSAGE_LEN = 20;

type ColorCombo = {
  id: string;
  colorA: string;
  colorB: string;
  quantity: number;
  scents: string[]; // one entry per unit in `quantity`
};

export default function CustomizeMiniPage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [combos, setCombos] = useState<ColorCombo[]>([]);
  const [pendingColorA, setPendingColorA] = useState<string>(COLORS[0]);
  const [pendingColorB, setPendingColorB] = useState<string>(COLORS[1]);
  const [scents, setScents] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function addCombo() {
    const defaultScent = scents[0] ?? "";
    setCombos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        colorA: pendingColorA,
        colorB: pendingColorB,
        quantity: 1,
        scents: [defaultScent],
      },
    ]);
  }

  function updateQuantity(id: string, delta: number) {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newQty = Math.max(1, c.quantity + delta);
        const newScents = [...c.scents];
        while (newScents.length < newQty) newScents.push(scents[0] ?? "");
        newScents.length = newQty;
        return { ...c, quantity: newQty, scents: newScents };
      })
    );
  }

  function updateUnitScent(comboId: string, unitIndex: number, scent: string) {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id !== comboId) return c;
        const newScents = [...c.scents];
        newScents[unitIndex] = scent;
        return { ...c, scents: newScents };
      })
    );
  }

  function applyScentToAll(comboId: string, scent: string) {
    setCombos((prev) =>
      prev.map((c) =>
        c.id === comboId ? { ...c, scents: c.scents.map(() => scent) } : c
      )
    );
  }

  function removeCombo(id: string) {
    setCombos((prev) => prev.filter((c) => c.id !== id));
  }

  const totalQuantity = combos.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = totalQuantity * PRICE_PER_CANDLE;

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      <div className="px-6 md:px-12 py-10 md:py-16 flex flex-col max-w-2xl mx-auto">
        <p
          className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3"
          style={{ color: "#DE4B33" }}
        >
          made by you, for you
        </p>
        <h1 className="font-serif leading-[1.05] mb-4">
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customize
          </span>
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#DE4B33" }}>
            your mini candles
          </span>
        </h1>
       <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
  Pick your color combos, quantities, and scents below. Have a design
  idea or question? DM us on Instagram @the_moon_candlesshop.
</p>

{/* Reference image of the actual mini candles */}
<div
  className="rounded-2xl overflow-hidden mb-8"
  style={{ border: "1px solid rgba(0,0,0,0.08)" }}
>
  <img
    src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/mini%20candles%20all.jpg"
    alt="Mini candles reference"
    className="w-full h-auto object-cover"
  />
</div>

{/* Step 1 — Photo, initials-only note */}

        {/* Step 1 — Photo, initials-only note */}
        <StepLabel n={1} title="Add a photo" />
        <div
          className="rounded-xl px-4 py-3 mb-2"
          style={{ border: "1.5px solid #DE4B33", backgroundColor: "#EFE3C4" }}
        >
          <p className="text-xs mb-3" style={{ color: "rgba(0,0,0,0.7)" }}>
           Because mini candles have limited space, please use initials only—not full photos or detailed images. Check the design reference for examples.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
            style={{ border: "1.5px dashed #DE4B33", backgroundColor: "#FFF4E6" }}
          >
            <PhotoUploadIcon />
            <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
              {photoUrl ? "Photo added — tap to change" : "Upload your initials design"}
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

          {photoUrl && (
            <div className="mt-3 flex justify-center">
              <img
                src={photoUrl}
                alt="Your uploaded design"
                className="h-24 w-24 object-cover rounded-lg"
                style={{ border: "1px solid #DE4B33" }}
              />
            </div>
          )}
        </div>

       

        {/* Step 3 — Color combo builder */}
        <StepLabel n={3} title="Choose your color combos" />
        <p className="text-xs mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
         Each mini candle uses two colors. Pick a pair below, then choose the quantity and scent for each candle.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide block mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>
              Color 1
            </label>
            <select
              value={pendingColorA}
              onChange={(e) => setPendingColorA(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: "1.5px solid #DE4B33", backgroundColor: "#FFFFFF", color: "#000000" }}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide block mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>
              Color 2
            </label>
            <select
              value={pendingColorB}
              onChange={(e) => setPendingColorB(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: "1.5px solid #DE4B33", backgroundColor: "#FFFFFF", color: "#000000" }}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={addCombo}
          className="w-full rounded-full py-2.5 text-sm font-medium mb-6 transition-colors"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B23A26")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#DE4B33")}
        >
          + Add this combo
        </button>

        {/* Step 4 — Per-combo quantity + per-unit scent */}
        {combos.length > 0 && (
          <>
            <StepLabel n={4} title="Set quantity & scent for each candle" />
            <div className="flex flex-col gap-4 mb-8">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="rounded-xl px-4 py-4"
                  style={{ backgroundColor: "#EFE3C4" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: "#000000" }}>
                      {combo.colorA} + {combo.colorB}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(combo.id, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ border: "1px solid #DE4B33", color: "#DE4B33" }}
                      >
                        −
                      </button>
                      <span className="text-sm w-5 text-center" style={{ color: "#000000" }}>
                        {combo.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(combo.id, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ border: "1px solid #DE4B33", color: "#DE4B33" }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeCombo(combo.id)}
                        className="ml-2 text-xs"
                        style={{ color: "rgba(0,0,0,0.4)" }}
                      >
                        remove
                      </button>
                    </div>
                  </div>

                  {/* Apply-to-all shortcut */}
                  {scents.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                        Apply one scent to all {combo.quantity}:
                      </span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) applyScentToAll(combo.id, e.target.value);
                        }}
                        defaultValue=""
                        className="text-xs rounded-md px-2 py-1"
                        style={{ border: "1px solid #DE4B33", backgroundColor: "#FFFFFF", color: "#000000" }}
                      >
                        <option value="" disabled>choose scent</option>
                        {scents.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Per-unit scent pickers */}
                  <div className="flex flex-col gap-2">
                    {combo.scents.map((unitScent, unitIndex) => (
                      <div key={unitIndex} className="flex items-center justify-between gap-2">
                        <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.6)" }}>
                          Candle {unitIndex + 1}
                        </span>
                        <select
                          value={unitScent}
                          onChange={(e) => updateUnitScent(combo.id, unitIndex, e.target.value)}
                          className="flex-1 text-xs rounded-md px-2 py-1.5"
                          style={{ border: "1px solid #DE4B33", backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          {scents.length === 0 && <option value="">Loading scents...</option>}
                          {scents.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Summary + checkout */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-4 mt-auto mb-4"
          style={{ backgroundColor: "#EFE3C4" }}
        >
          <span className="text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>
            {totalQuantity} candle{totalQuantity === 1 ? "" : "s"} total
          </span>
          <span className="text-lg font-semibold" style={{ color: "#000000" }}>
            {totalPrice} LE
          </span>
        </div>

        <button
          disabled={combos.length === 0}
          onClick={() => {
            // TODO: wire this up to your actual checkout/cart flow once ready
            console.log("Add mini candles to cart", { photoUrl, message, combos });
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-full text-sm md:text-base font-semibold transition-colors disabled:opacity-40"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          onMouseEnter={(e) => {
            if (combos.length > 0) e.currentTarget.style.backgroundColor = "#B23A26";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#DE4B33")}
        >
          Checkout — {totalPrice} LE
        </button>
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