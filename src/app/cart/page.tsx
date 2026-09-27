"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CartItem,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  cartTotal,
  cartCount,
} from "@/lib/cart";

const ACCENT = "#8FAA82";
const CREAM = "#FFF4E6";
const SAND = "#EFE3C4";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  function refresh() {
    setItems(getCart());
  }

  useEffect(() => {
    refresh();
    setHydrated(true);

    window.addEventListener("cartUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("cartUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const total = cartTotal(items);
  const count = cartCount(items);

  if (!hydrated) return null;

  return (
    <div
      className="min-h-full flex-1 font-sans"
      style={{ backgroundColor: CREAM }}
    >
      <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-10 md:py-14">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
           

            <h1
              className="text-3xl font-bold uppercase tracking-wide md:text-4xl"
              style={{ color: BLACK }}
            >
              Your Cart
            </h1>
          </div>

          {items.length > 0 && (
            <div
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: WHITE,
                color: ACCENT,
              }}
            >
              {count} item{count !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty cart */
          <div
            className="flex flex-col items-center rounded-3xl px-6 py-20 text-center"
            style={{
              backgroundColor: WHITE,
              boxShadow: "0 10px 35px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-xl"
              style={{
                backgroundColor: SAND,
                color: ACCENT,
              }}
            >
              ♡
            </div>

            <h2
              className="text-lg font-semibold"
              style={{ color: BLACK }}
            >
              Your cart is empty
            </h2>

            <p
              className="mt-2 max-w-xs text-sm"
              style={{ color: "rgba(0,0,0,0.55)" }}
            >
              Nothing here yet. Find something you love from our collection.
            </p>

            <Link
              href="/shop"
              className="mt-6 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: ACCENT,
                color: WHITE,
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_300px]">
            {/* Cart items */}
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                backgroundColor: WHITE,
                boxShadow: "0 10px 35px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="border-b px-5 py-4 md:px-6"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: BLACK }}
                >
                  Items
                </p>
              </div>

              <div className="flex flex-col">
                {items.map((item, index) => {
                  const lineTotal = item.price * item.quantity;

                                    return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 px-4 py-4 md:px-5"
                      style={{
                        borderBottom:
                          index !== items.length - 1
                            ? "1px solid rgba(0,0,0,0.08)"
                            : "none",
                      }}
                    >
                      {/* Image + name, side by side */}
                                           <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex flex-shrink-0 gap-1">
                          <div
                            className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl md:h-[68px] md:w-[68px]"
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

                          {item.customization?.type === "monogram" &&
                            item.customization.monogramImage && (
                              <img
                                src={item.customization.monogramImage}
                                alt="Custom lettering"
                                className="h-16 w-16 flex-shrink-0 rounded-xl object-cover md:h-[68px] md:w-[68px]"
                              />
                            )}
                        </div>

                        <p
                          className="text-sm font-semibold"
                          style={{ color: BLACK }}
                        >
                          {item.productName}
                        </p>
                      </div>
                                            {/* Color / scent / personalization — full width, one line each */}
                      <div className="flex flex-col gap-0.5">
                        {item.color && (
                          <p
                            className="whitespace-nowrap text-[11px]"
                            style={{ color: "rgba(0,0,0,0.5)" }}
                          >
                            Color: {item.color}
                          </p>
                        )}

                        <p
                          className="whitespace-nowrap text-[11px]"
                          style={{ color: "rgba(0,0,0,0.5)" }}
                        >
                          {item.scent ?? "Unscented"}
                        </p>

                        {item.customization?.type === "monogram" &&
                          item.customization.monogramText && (
                            <p
                              className="whitespace-nowrap text-[11px]"
                              style={{ color: "rgba(0,0,0,0.5)" }}
                            >
                              Initials: {item.customization.monogramText}
                            </p>
                          )}
                      </div>

                      {/* Quantity + price, on their own row */}
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center rounded-full border px-1 py-1"
                          style={{ borderColor: "rgba(0,0,0,0.1)" }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateCartItemQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold transition-all hover:scale-110 active:scale-95"
                            style={{ color: BLACK }}
                          >
                            −
                          </button>

                          <span
                            className="w-6 text-center text-xs font-semibold"
                            style={{ color: BLACK }}
                          >
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartItemQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold transition-all hover:scale-110 active:scale-95"
                            style={{ color: BLACK }}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex flex-col items-end">
                          <p
                            className="text-sm font-bold"
                            style={{ color: ACCENT }}
                          >
                            {lineTotal} EGP
                          </p>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="mt-1 text-[10px] underline transition-opacity hover:opacity-60"
                            style={{
                              color: "rgba(0,0,0,0.45)",
                            }}
                          >
                            remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div
              className="h-fit rounded-3xl p-6"
              style={{
                backgroundColor: WHITE,
                boxShadow: "0 10px 35px rgba(0,0,0,0.04)",
              }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: BLACK }}
              >
                Order Summary
              </p>

              <div
                className="my-5 h-px"
                style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
              />

              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "rgba(0,0,0,0.6)" }}
                >
                  {count} item{count !== 1 ? "s" : ""}
                </span>

                <span
                  className="text-sm font-semibold"
                  style={{ color: BLACK }}
                >
                  {total} EGP
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "rgba(0,0,0,0.6)" }}
                >
                  Shipping
                </span>

                <span
                  className="text-xs"
                  style={{ color: "rgba(0,0,0,0.5)" }}
                >
                  Calculated at delivery
                </span>
              </div>

              <div
                className="my-5 h-px"
                style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
              />

              <div className="flex items-center justify-between">
                <span
                  className="text-base font-bold"
                  style={{ color: BLACK }}
                >
                  Total
                </span>

                <span
                  className="text-xl font-bold"
                  style={{ color: ACCENT }}
                >
                  {total} EGP
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  backgroundColor: ACCENT,
                  color: WHITE,
                }}
              >
                Proceed to Checkout
              </button>

              <Link
                href="/shop"
                className="mt-3 block text-center text-xs font-medium transition-opacity hover:opacity-60"
                style={{ color: "rgba(0,0,0,0.55)" }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}