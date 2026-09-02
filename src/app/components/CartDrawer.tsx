"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import {
  type CartItem,
  getCart,
  cartTotal,
  cartCount,
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/cart";

const ACCENT = "#8FAA82";
const CREAM = "#FFF4E6";
const SAND = "#EFE3C4";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  // Load the cart once on mount, then keep it in sync and open the
  // drawer whenever anything dispatches "cartUpdated" (every Add to
  // Cart button across the site already fires this event).
  useEffect(() => {
    setItems(getCart());

        function handleCartUpdated(e: Event) {
      setItems(getCart());

      const detail = (e as CustomEvent<{ open?: boolean }>).detail;

      if (detail?.open) {
        setOpen(true);
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const total = cartTotal(items);
  const count = cartCount(items);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[998] bg-black/40 transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer — slides in from the right */}
      <div
        className="fixed right-0 top-0 z-[999] flex h-full w-full max-w-sm flex-col shadow-xl transition-transform duration-300"
        style={{
          backgroundColor: CREAM,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-bold uppercase tracking-wide"
              style={{ color: BLACK }}
            >
              Your Cart
            </h2>

            {items.length > 0 && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: WHITE, color: ACCENT }}
              >
                {count} item{count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-60"
          >
            <X size={20} style={{ color: BLACK }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: SAND, color: ACCENT }}
              >
                ♡
              </div>

              <h3
                className="text-base font-semibold"
                style={{ color: BLACK }}
              >
                Your cart is empty
              </h3>

              <p
                className="mt-2 max-w-[220px] text-sm"
                style={{ color: "rgba(0,0,0,0.55)" }}
              >
                Nothing here yet. Find something you love from our
                collection.
              </p>

              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                style={{ backgroundColor: ACCENT, color: WHITE }}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b py-5"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <div
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl"
                  style={{ backgroundColor: SAND }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: BLACK }}
                    >
                      {item.productName}
                    </p>

                    {(item.color || item.scent) && (
                      <p
                        className="mt-0.5 text-[11px]"
                        style={{ color: "rgba(0,0,0,0.5)" }}
                      >
                        {[item.color, item.scent].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <p
                      className="mt-1 text-[11px]"
                      style={{ color: "rgba(0,0,0,0.45)" }}
                    >
                      {item.price} EGP each
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="flex items-center rounded-full border px-1 py-1"
                      style={{ borderColor: "rgba(0,0,0,0.1)" }}
                    >
                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                        aria-label="Decrease quantity"
                        style={{ color: BLACK }}
                      >
                        <Minus size={12} />
                      </button>

                      <span
                        className="w-6 text-center text-xs font-semibold"
                        style={{ color: BLACK }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                        aria-label="Increase quantity"
                        style={{ color: BLACK }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span
                      className="ml-auto text-sm font-bold"
                      style={{ color: ACCENT }}
                    >
                      {item.price * item.quantity} EGP
                    </span>
                  </div>

                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="mt-1 self-start text-[11px] underline transition-opacity hover:opacity-60"
                    style={{ color: "rgba(0,0,0,0.45)" }}
                  >
                    remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order summary */}
        {items.length > 0 && (
          <div
            className="border-t px-5 py-5"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                {count} item{count !== 1 ? "s" : ""}
              </span>

              <span className="text-sm font-semibold" style={{ color: BLACK }}>
                {total} EGP
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                Shipping
              </span>

              <span className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                Calculated at delivery
              </span>
            </div>

            <div
              className="my-4 h-px"
              style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
            />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-bold" style={{ color: BLACK }}>
                Total
              </span>

              <span className="text-xl font-bold" style={{ color: ACCENT }}>
                {total} EGP
              </span>
                        </div>

                        <a href="/checkout" className="block w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]" style={{ backgroundColor: ACCENT, color: WHITE }}>
              Proceed to Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}