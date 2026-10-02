"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  getMiniCandlesPhoto,
  type CartItem,
} from "@/lib/cart";
import { uploadCustomerImage } from "@/lib/uploadCustomerImage";
const MINI_CANDLES_PRODUCT_ID = "mini-candles";
const MINI_CANDLES_PRODUCT_NAME = "Mini Candles";
const MINI_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/mini%20candles%20all.jpg";

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
  // Whether this combo has been pushed to the cart yet. Uncommitted
  // combos are purely local (staged, not yet in the cart).
  committed?: boolean;
  // For committed combos only: whether the current on-page state
  // matches what's actually in the cart. Local edits set this false
  // ("dirty") instead of pushing immediately — the Update button is
  // what actually syncs and flips it back to true.
  synced?: boolean;
};

function comboKeyId(colorA: string, colorB: string) {
  return `combo-${colorA}-${colorB}`.toLowerCase().replace(/\s+/g, "-");
}

function comboLineId(colorA: string, colorB: string, scent: string) {
  return [MINI_CANDLES_PRODUCT_ID, colorA, colorB, scent || "unscented"]
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * Rebuilds the committed combos directly from whatever's actually in the
 * cart right now. Used both on first mount (so combos survive a page
 * reload) and on every "cartUpdated" event (so drawer edits reflect
 * back onto the page).
 */
function buildCommittedCombosFromCart(cart: CartItem[]): ColorCombo[] {
  const byColor = new Map<string, CartItem[]>();

  cart
    .filter((item) => item.productId === MINI_CANDLES_PRODUCT_ID && item.color)
    .forEach((item) => {
      const key = item.color as string;
      if (!byColor.has(key)) byColor.set(key, []);
      byColor.get(key)!.push(item);
    });

  const result: ColorCombo[] = [];

  byColor.forEach((items, colorKey) => {
    const [colorA, colorB] = colorKey.split(" + ");
    if (!colorA || !colorB) return;

    const scentsFlat: string[] = [];
    items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        scentsFlat.push(item.scent ?? "");
      }
    });

    if (scentsFlat.length === 0) return;

    result.push({
      id: comboKeyId(colorA, colorB),
      colorA,
      colorB,
      quantity: scentsFlat.length,
      scents: scentsFlat,
      committed: true,
      synced: true,
    });
  });

  return result;
}

export default function CustomizeMiniPage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [combos, setCombos] = useState<ColorCombo[]>([]);
  const [pendingColorA, setPendingColorA] = useState<string>(COLORS[0]);
  const [pendingColorB, setPendingColorB] = useState<string>(COLORS[1]);
  const [scents, setScents] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
const [category, setCategory] = useState<string | null>(null);
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
useEffect(() => {
  async function loadCategory() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("id", 32)
      .single();
    if (error) {
      console.error("Failed to load category:", error.message);
      return;
    }
    setCategory(data?.category ?? null);
  }
  loadCategory();
}, []);
  /*
   * ============================================================
   * CART SYNC
   * ============================================================
   *
   * Runs once on mount (rebuilding any combos already in the cart —
   * e.g. after a page reload) and again every time the cart changes
   * anywhere else (the drawer, another tab, etc). Uncommitted combos
   * the person is still staging are preserved as-is. Committed combos
   * that are still "dirty" (unsaved local edits, Update not pressed
   * yet) are ALSO preserved as-is — otherwise this rebuild would wipe
   * out an in-progress edit with the cart's older data. Only combos
   * that are fully synced get refreshed from the cart.
   */
  useEffect(() => {
  function syncFromCart() {
const photoInCart = getCart()
  .filter((item) => item.productId === MINI_CANDLES_PRODUCT_ID)
  .map(getMiniCandlesPhoto)
  .find((p): p is string => p !== null);
  if (photoInCart) setPhotoUrl((prev) => prev ?? photoInCart);

  setCombos((prev) => {
    
        const stillPending = prev.filter((c) => !c.committed);

        const dirty = new Map(
          prev
            .filter((c) => c.committed && c.synced === false)
            .map((c) => [c.id, c])
        );

        const committedFromCart = buildCommittedCombosFromCart(getCart());
        const merged = committedFromCart.map((c) => dirty.get(c.id) ?? c);

        // A dirty combo whose cart lines were all removed elsewhere
        // (e.g. the whole thing deleted from the drawer) won't show up
        // in committedFromCart — keep it anyway so the edit isn't lost.
        dirty.forEach((c, id) => {
          if (!merged.some((m) => m.id === id)) merged.push(c);
        });

        return [...merged, ...stillPending];
      });
    }

    syncFromCart();

    window.addEventListener("cartUpdated", syncFromCart);
    return () => window.removeEventListener("cartUpdated", syncFromCart);
  }, []);

 async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose a photo under 5MB.");
    return;
  }

  setUploading(true);
  try {
    const url = await uploadCustomerImage(file, "mini-candles");
    setPhotoUrl(url);

    // Candles already in the cart need this photo too, so show their
    // "Update cart" button.
    setCombos((prev) =>
      prev.map((c) => (c.committed ? { ...c, synced: false } : c))
    );
  } catch {
    alert("Couldn't upload your photo. Please check your connection and try again.");
  } finally {
    setUploading(false);
  }
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

  /**
   * Pushes one combo's current quantity/scent breakdown to the cart —
   * creating, updating, or removing cart lines as needed so the cart
   * ends up with exactly the lines this combo implies. Safe to call
   * repeatedly; never double-adds. This is the only thing that
   * actually touches the cart/opens the drawer for an existing combo.
   */
function syncComboToCart(combo: ColorCombo) {
  const colorKey = `${combo.colorA} + ${combo.colorB}`;
  const photo = photoUrl ?? null;

  const scentCounts = new Map<string, number>();
  combo.scents.forEach((scent) => {
    scentCounts.set(scent, (scentCounts.get(scent) ?? 0) + 1);
  });

  const cart = getCart();
  const existingLinesForColor = cart.filter(
    (item) =>
      item.productId === MINI_CANDLES_PRODUCT_ID && item.color === colorKey
  );

  scentCounts.forEach((quantity, scent) => {
    const lineId = comboLineId(combo.colorA, combo.colorB, scent);
    const existingLine = existingLinesForColor.find((l) => l.id === lineId);
    const linePhoto = existingLine ? getMiniCandlesPhoto(existingLine) : null;

    if (existingLine && linePhoto === photo) {
      if (existingLine.quantity !== quantity) {
        updateCartItemQuantity(lineId, quantity);
      }
      return;
    }

    // New line, or the photo changed: (re)create the line with the photo.
    if (existingLine) removeCartItem(lineId);

    addToCart({
      id: lineId,
      productId: MINI_CANDLES_PRODUCT_ID,
      productName: MINI_CANDLES_PRODUCT_NAME,
      price: PRICE_PER_CANDLE,
      quantity,
      scent: scent || null,
      color: colorKey,
      image: MINI_IMG,
      productRefId: 32,
      category,
      ...(photo
        ? { customization: { type: "mini-candles", photoUrl: photo } }
        : {}),
    });
  });

  existingLinesForColor.forEach((line) => {
    const scentKey = line.scent ?? "";
    if (!scentCounts.has(scentKey)) {
      removeCartItem(line.id);
    }
  });
}

  /** The Update button for a combo: pushes it to the cart and marks it synced. */
  function pushComboUpdate(combo: ColorCombo) {
    syncComboToCart(combo);
    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, synced: true } : c))
    );
  }

  function updateQuantity(id: string, delta: number) {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const newQty = Math.max(1, c.quantity + delta);
        const newScents = [...c.scents];
        while (newScents.length < newQty) newScents.push(scents[0] ?? "");
        newScents.length = newQty;

        return {
          ...c,
          quantity: newQty,
          scents: newScents,
          synced: c.committed ? false : c.synced,
        };
      })
    );
  }

  function updateUnitScent(comboId: string, unitIndex: number, scent: string) {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id !== comboId) return c;

        const newScents = [...c.scents];
        newScents[unitIndex] = scent;

        return {
          ...c,
          scents: newScents,
          synced: c.committed ? false : c.synced,
        };
      })
    );
  }

  function applyScentToAll(comboId: string, scent: string) {
    setCombos((prev) =>
      prev.map((c) => {
        if (c.id !== comboId) return c;

        return {
          ...c,
          scents: c.scents.map(() => scent),
          synced: c.committed ? false : c.synced,
        };
      })
    );
  }

function removeCombo(id: string) {
    // Same fix as addComboOrderToCart — find the combo and, if it
    // needs a cart write, do that BEFORE calling setCombos, not
    // inside its updater.
    const combo = combos.find((c) => c.id === id);

    // Removing is a deliberate, final action — unlike quantity/scent
    // tweaks it takes effect immediately rather than waiting on Update.
    if (combo?.committed) {
      syncComboToCart({ ...combo, quantity: 0, scents: [] });
    }

    setCombos((prev) => prev.filter((c) => c.id !== id));
  }

  /**
   * Commits every staged (uncommitted) combo to the cart. Combos stay
   * on the page afterward — they just flip to "committed" and become
   * synced with their cart lines instead of disappearing.
   */
function addComboOrderToCart() {
    const hasPending = combos.some((c) => !c.committed);
    if (!hasPending) return;

    // Compute the new combo list FIRST, as a plain value — no cart
    // writes here. syncComboToCart (which dispatches "cartUpdated")
    // used to run inside the setCombos updater itself; React can
    // invoke that updater during its own render/commit work, and the
    // synchronous dispatch was triggering CartDrawer's setState in
    // the middle of that — hence "Cannot update a component
    // (CartDrawer) while rendering a different component
    // (CustomizeMiniPage)". Doing the cart writes as a separate step
    // after setCombos avoids that entirely.
    const committed = combos.filter((c) => c.committed);
    const stillPending = combos.filter((c) => !c.committed);

    const byStableId = new Map<string, ColorCombo>();
    committed.forEach((c) => byStableId.set(c.id, c));

    const toSync: ColorCombo[] = [];

    stillPending.forEach((pending) => {
      const stableId = comboKeyId(pending.colorA, pending.colorB);
      const existing = byStableId.get(stableId);

      const merged: ColorCombo = existing
        ? {
            ...existing,
            quantity: existing.quantity + pending.quantity,
            scents: [...existing.scents, ...pending.scents],
          }
        : { ...pending, id: stableId, committed: true };

      byStableId.set(stableId, { ...merged, synced: true });
      toSync.push(merged);
    });

    setCombos(Array.from(byStableId.values()));

    // Now do the actual cart writes, after state has already been
    // scheduled — not while it's being computed.
    toSync.forEach((combo) => syncComboToCart(combo));
  }

  const totalQuantity = combos.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = totalQuantity * PRICE_PER_CANDLE;
  const hasPendingCombo = combos.some((c) => !c.committed);

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
           Because mini candles have limited space, please use initials only not full photos or detailed images. Check the design reference above for examples.
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
          {uploading && (
  <p className="mt-2 text-xs" style={{ color: "#DE4B33" }}>
    Uploading your photo…
  </p>
)}
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
              {combos.map((combo) => {
                const isDirty = combo.committed && combo.synced === false;

                return (
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

                  {/* Update button — only appears once this combo has
                      unsaved changes relative to what's in the cart. */}
                  {isDirty && (
                    <button
                      onClick={() => pushComboUpdate(combo)}
                      className="mt-4 w-full rounded-full py-2 text-xs font-semibold transition-colors"
                      style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B23A26")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#DE4B33")}
                    >
                      Update cart
                    </button>
                  )}
                </div>
                );
              })}
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
          disabled={!hasPendingCombo}
          onClick={addComboOrderToCart}
          className="w-full inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-full text-sm md:text-base font-semibold transition-colors disabled:opacity-40"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          onMouseEnter={(e) => {
            if (hasPendingCombo) e.currentTarget.style.backgroundColor = "#B23A26";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#DE4B33")}
        >
          Add to Order
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