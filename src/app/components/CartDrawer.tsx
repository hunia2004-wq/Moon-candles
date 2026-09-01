"use client";

import { useEffect, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import {
  type CartItem,
  getCart,
  cartTotal,
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/cart";

const BLACK = "#000000";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
    function refresh() {
      setItems(getCart());
    }

    function handleOpen() {
      refresh();
      setOpen(true);
    }

    refresh();

    // "cartUpdated" fires on every add/remove/quantity change — treat it
    // the same as "openCart" so the drawer pops open automatically
    // whenever the cart changes, not just when the cart icon is tapped.
    window.addEventListener("cartUpdated", handleOpen);
    window.addEventListener("openCart", handleOpen);

    return () => {
      window.removeEventListener("cartUpdated", handleOpen);
      window.removeEventListener("openCart", handleOpen);
    };
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
        className="fixed right-0 top-0 z-[999] flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold" style={{ color: BLACK }}>
            Shopping cart
          </h2>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-60"
          >
            <X size={20} style={{ color: BLACK }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <p
              className="py-10 text-center text-sm"
              style={{ color: "rgba(0,0,0,0.5)" }}
            >
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b py-5"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: BLACK }}>
                      {item.productName}
                    </p>

                    {(item.color || item.scent) && (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "rgba(0,0,0,0.5)" }}
                      >
                        {[item.color, item.scent].filter(Boolean).join(" / ")}
                      </p>
                    )}

                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: BLACK }}
                    >
                      LE {item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="flex items-center rounded-full border"
                      style={{ borderColor: "rgba(0,0,0,0.15)" }}
                    >
                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>

                      <span className="w-6 text-center text-xs font-medium">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-7 w-7 items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="text-xs underline"
                      style={{ color: "rgba(0,0,0,0.5)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div
            className="border-t px-5 py-5"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: BLACK }}>
                Subtotal
              </span>

              <span className="text-base font-bold" style={{ color: BLACK }}>
                LE {cartTotal(items).toFixed(2)}
              </span>
            </div>

            
            <a href="/checkout" className="block w-full rounded-full px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLACK }}>Check out</a>
          </div>
        )}
      </div>
    </>
  );
}