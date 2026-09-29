"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type CartItem,
  getCart,
  cartTotal,
  clearCart,
} from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#8FAA82";
const ERROR = "#C0392B";
const CREAM = "#FFF4E6";
const SAND = "#EFE3C4";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

// Delivery zones Moon ships to, with the delivery fee for each — shown
// in the checkout dropdown and added to the order total automatically
// once the customer picks a zone.
const DELIVERY_ZONES = [
  { name: "Alexandria", fee: 60 },
  { name: "Burj Al Arab", fee: 85 },
  { name: "Al-Amriya", fee: 85 },
  { name: "Abdel Qader", fee: 85 },
  { name: "Cairo", fee: 95 },
  { name: "New Cairo", fee: 95 },
  { name: "Giza", fee: 95 },
  { name: "10th of Ramadan", fee: 105 },
  { name: "Obour City", fee: 105 },
  { name: "Badr City", fee: 105 },
  { name: "Ajmi", fee: 80 },
  { name: "Sadat City", fee: 105 },
  { name: "Ismailia", fee: 105 },
  { name: "Suez", fee: 105 },
  { name: "Port Said", fee: 105 },
  { name: "Dakahlia", fee: 105 },
  { name: "Qalyubia", fee: 105 },
  { name: "Menoufia", fee: 105 },
  { name: "Sharkia", fee: 105 },
  { name: "Gharbia", fee: 105 },
  { name: "Beheira", fee: 105 },
  { name: "Kafr El Sheikh", fee: 105 },
  { name: "Damietta", fee: 105 },
  { name: "Beni Suef", fee: 120 },
  { name: "Fayoum", fee: 120 },
  { name: "Minya", fee: 120 },
  { name: "Assiut", fee: 120 },
  { name: "Qena", fee: 120 },
  { name: "Luxor", fee: 120 },
  { name: "Aswan", fee: 120 },
  { name: "Red Sea", fee: 130 },
  { name: "Sohag", fee: 120 },
  { name: "Matruh", fee: 140 },
  { name: "North Coast", fee: 140 },
  { name: "New Valley", fee: 150 },
  { name: "South Sinai", fee: 150 },
  { name: "Ajmi To Alex", fee: 80 },
  { name: "Ajmi To Ajmi", fee: 60 },
] as const;

type FormState = {
  fullName: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  city: "",
  country: "Egypt",
  address: "",
  notes: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// Order the fields appear on screen — used to scroll to the first
// field with a problem.
const FIELD_ORDER: (keyof FormState)[] = [
  "fullName",
  "phone",
  "city",
  "country",
  "address",
];

// Accepts Egyptian mobile numbers like 01012345678, +201012345678,
// or 201012345678 (spaces and dashes are ignored).
const EG_MOBILE_REGEX = /^(?:\+?20|0)?1[0125]\d{8}$/;

type PlacedOrder = {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  customer: FormState;
  orderNumber: string;
  createdAt: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [placedOrder, setPlacedOrder] =
    useState<PlacedOrder | null>(null);

  useEffect(() => {
    setItems(getCart());
    setHydrated(true);
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear this field's error as soon as the person starts fixing it.
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    const phoneDigits = form.phone.replace(/[\s-]/g, "");

    if (!phoneDigits) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (!EG_MOBILE_REGEX.test(phoneDigits)) {
      nextErrors.phone =
        "Enter a valid Egyptian mobile number, e.g. 01012345678.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Please select your delivery zone.";
    }

    if (!form.country.trim()) {
      nextErrors.country = "Country is required.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Please enter your delivery address.";
    } else if (form.address.trim().length < 8) {
      nextErrors.address =
        "Please enter your full address (street, building, apartment).";
    }

    return nextErrors;
  }

  // Looked up from the selected zone name — 0 until a zone is chosen.
  const selectedZone = DELIVERY_ZONES.find(
    (z) => z.name === form.city
  );
  const shippingFee = selectedZone?.fee ?? 0;
  const subtotal = cartTotal(items);
  const grandTotal = subtotal + shippingFee;

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const nextErrors = validate();
  setErrors(nextErrors);

  const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);

  if (firstInvalid) {
    const el = document.getElementById(`field-${firstInvalid}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
    return;
  }

  const order: PlacedOrder = {
    items,
    subtotal,
    shippingFee,
    total: grandTotal,
    customer: form,
    orderNumber: `MC-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };

  const supabase = createClient();
  const { error } = await supabase.from("orders").insert({
    customer_name: form.fullName,
    customer_phone: form.phone,
    governorate: form.city,
    address: `${form.address}${form.notes ? ` — Note: ${form.notes}` : ""}`,
    items,
    total: grandTotal,
  });

  if (error) {
    alert(`Couldn't place your order: ${error.message}`);
    return;
  }

  clearCart();
  setPlacedOrder(order);
}

  if (!hydrated) return null;

  /* ---------------- CONFIRMATION / RECEIPT ---------------- */

  if (placedOrder) {
    const orderDate = new Date(placedOrder.createdAt);

    const formattedDate = orderDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const formattedTime = orderDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        className="min-h-full flex-1 font-mono"
        style={{
          backgroundColor: CREAM,
          color: BLACK,
        }}
      >
        <main className="mx-auto flex w-full max-w-lg flex-col items-center px-5 py-10 md:py-14">
          {/* SUCCESS */}
          <div className="mb-8 text-center font-sans">
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: ACCENT,
                color: WHITE,
              }}
            >
              ✓
            </div>

            <h1 className="text-xl font-semibold tracking-tight">
              Order Confirmed
            </h1>

            <p
              className="mt-1 text-xs"
              style={{ color: "rgba(0,0,0,0.5)" }}
            >
              Thank you for shopping with Moon.
            </p>
          </div>

          {/* ================= RECEIPT ================= */}

          <div
            className="relative w-full bg-white"
            style={{
              maxWidth: "390px",
              boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
            }}
          >
            {/* RECEIPT CONTENT */}
            <div className="px-7 pb-8 pt-8 sm:px-9">
              {/* STORE HEADER */}
              <div className="text-center">
                <h2
                  className="text-[27px] font-bold tracking-[0.22em]"
                  style={{ letterSpacing: "0.18em" }}
                >
                  MOON CANDLES
                </h2>

                

                <p
                  className="mt-2 text-[8px] leading-3"
                  style={{ color: "rgba(0,0,0,0.55)" }}
                >
                  Handmade with love
                </p>
              </div>

              {/* TOP DIVIDER */}
              <div
                className="my-5 border-t border-dashed"
                style={{
                  borderColor: "rgba(0,0,0,0.45)",
                }}
              />

              {/* RECEIPT META */}
              <div className="text-[9px] leading-4">
                <div className="flex justify-between">
                  <span>ORDER</span>
                  <span className="font-bold">
                    #{placedOrder.orderNumber}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>DATE</span>
                  <span>{formattedDate}</span>
                </div>

                <div className="flex justify-between">
                  <span>TIME</span>
                  <span>{formattedTime}</span>
                </div>

                <div className="flex justify-between">
                  <span>PAYMENT</span>
                  <span>CASH ON DELIVERY</span>
                </div>
              </div>

              {/* DIVIDER */}
              <div
                className="my-5 border-t border-dashed"
                style={{
                  borderColor: "rgba(0,0,0,0.45)",
                }}
              />

              {/* CUSTOMER */}
              <div className="text-[9px]">
                <p className="mb-2 font-bold uppercase tracking-[0.12em]">
                  Customer
                </p>

                <div className="space-y-0.5">
                  <p>{placedOrder.customer.fullName}</p>
                  <p>{placedOrder.customer.phone}</p>
                  <p>
                    {placedOrder.customer.city},{" "}
                    {placedOrder.customer.country}
                  </p>
                  <p className="leading-4">
                    {placedOrder.customer.address}
                  </p>
                </div>
              </div>

              {/* DIVIDER */}
              <div
                className="my-5 border-t border-dashed"
                style={{
                  borderColor: "rgba(0,0,0,0.45)",
                }}
              />

              {/* ITEMS HEADER */}
              <div className="grid grid-cols-[1fr_35px_75px] gap-2 text-[8px] font-bold uppercase">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Amount</span>
              </div>

              <div
                className="mt-2 border-t"
                style={{
                  borderColor: "rgba(0,0,0,0.25)",
                }}
              />

              {/* PRODUCTS */}
              <div>
                {placedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3"
                    style={{
                      borderBottom:
                        "1px dashed rgba(0,0,0,0.25)",
                    }}
                  >
                    <div className="grid grid-cols-[1fr_35px_75px] gap-2">
                      {/* PRODUCT */}
                      <div className="min-w-0">
                        <p className="break-words text-[10px] font-bold leading-4">
                          {item.productName}
                        </p>

                        {(item.color || item.scent) && (
                          <p
                            className="mt-0.5 text-[8px] leading-3"
                            style={{
                              color: "rgba(0,0,0,0.55)",
                            }}
                          >
                            {[item.color, item.scent]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        )}

                        <p
                          className="mt-1 text-[8px]"
                          style={{
                            color: "rgba(0,0,0,0.5)",
                          }}
                        >
                          {item.price.toLocaleString()} EGP ×{" "}
                          {item.quantity}
                        </p>
                      </div>

                      {/* QTY */}
                      <div className="text-center text-[9px]">
                        {item.quantity}
                      </div>

                      {/* AMOUNT */}
                      <div className="text-right text-[9px] font-bold">
                        {(
                          item.price * item.quantity
                        ).toLocaleString()}{" "}
                        EGP
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALS */}
              <div className="mt-4 space-y-1.5 text-[9px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>
                    {placedOrder.subtotal.toLocaleString()} EGP
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>SHIPPING</span>
                  <span>
                    {placedOrder.shippingFee.toLocaleString()} EGP
                  </span>
                </div>
              </div>

              {/* TOTAL DIVIDER */}
              <div
                className="my-4 border-t-2"
                style={{
                  borderColor: BLACK,
                }}
              />

              {/* GRAND TOTAL */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold">TOTAL</span>

                <span className="text-[15px] font-bold">
                  {placedOrder.total.toLocaleString()} EGP
                </span>
              </div>

              {/* PAYMENT */}
              <div
                className="mt-5 border px-3 py-2.5 text-center"
                style={{
                  borderColor: "rgba(0,0,0,0.35)",
                }}
              >
                <p className="text-[8px] font-bold uppercase tracking-[0.12em]">
                  Payment Method
                </p>

                <p className="mt-1 text-[9px] font-bold">
                  CASH ON DELIVERY
                </p>
              </div>

              {/* NOTES */}
              {placedOrder.customer.notes && (
                <>
                  <div
                    className="my-5 border-t border-dashed"
                    style={{
                      borderColor: "rgba(0,0,0,0.35)",
                    }}
                  />

                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em]">
                      Delivery Notes
                    </p>

                    <p
                      className="mt-1.5 text-[8px] leading-4"
                      style={{
                        color: "rgba(0,0,0,0.65)",
                      }}
                    >
                      {placedOrder.customer.notes}
                    </p>
                  </div>
                </>
              )}

              {/* FOOTER DIVIDER */}
              <div
                className="my-6 border-t border-dashed"
                style={{
                  borderColor: "rgba(0,0,0,0.45)",
                }}
              />

              {/* RECEIPT FOOTER */}
              <div className="text-center">
                <p className="text-[10px] font-bold">THANK YOU!</p>

                <p
                  className="mt-1.5 text-[8px] leading-3.5"
                  style={{
                    color: "rgba(0,0,0,0.55)",
                  }}
                >
                  Thank you for choosing Moon.
                  <br />
                  Your order will be prepared with care.
                </p>

                <p className="mt-4 text-[8px] font-bold tracking-[0.2em]">
                  MOON CANDLES
                </p>
              </div>
            </div>

            {/* ================= TORN PAPER EDGE ================= */}

            <div
              className="h-4 w-full"
              style={{
                background:
                  "linear-gradient(135deg, transparent 6px, #ffffff 0) 0 0 / 12px 12px repeat-x",
              }}
            />
          </div>

          {/* CONTINUE SHOPPING */}
          <div className="mt-7 w-full max-w-[390px] font-sans">
            <Link
              href="/shop"
              className="block w-full px-6 py-3.5 text-center text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: ACCENT,
                color: WHITE,
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- EMPTY CART ---------------- */

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 font-sans"
        style={{ backgroundColor: CREAM }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            backgroundColor: SAND,
            color: ACCENT,
          }}
        >
          ♡
        </div>

        <p
          className="text-sm"
          style={{ color: "rgba(0,0,0,0.6)" }}
        >
          Your cart is empty.
        </p>

        <Link
          href="/shop"
          className="rounded-full px-7 py-3 text-sm font-semibold"
          style={{
            backgroundColor: ACCENT,
            color: WHITE,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  /* ---------------- CHECKOUT ---------------- */

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="min-h-full flex-1 font-sans"
      style={{ backgroundColor: CREAM }}
    >
      <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-10 md:py-14">
        {/* Top */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="group mb-6 flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: BLACK }}
          >
            <ArrowLeft
              size={20}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            <span>Back</span>
          </button>

          <h1
            className="text-3xl font-bold uppercase tracking-wide md:text-4xl"
            style={{ color: BLACK }}
          >
            Checkout
          </h1>

          <p
            className="mt-2 text-sm"
            style={{ color: "rgba(0,0,0,0.55)" }}
          >
            Enter your delivery details and place your order.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
          {/* FORM */}
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              backgroundColor: WHITE,
              boxShadow: "0 10px 35px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mb-6">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: BLACK }}
              >
                Delivery Details
              </p>

              <p
                className="mt-1 text-[11px]"
                style={{ color: "rgba(0,0,0,0.5)" }}
              >
                <span style={{ color: ERROR }}>*</span> All fields
                marked are required.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              <Field
                id="field-fullName"
                label="Full Name"
                required
                value={form.fullName}
                onChange={(v) => updateField("fullName", v)}
                error={errors.fullName}
              />

              <Field
                id="field-phone"
                label="Phone Number"
                required
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                error={errors.phone}
                type="tel"
                placeholder="01012345678"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="field-city"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Delivery Zone{" "}
                    <span style={{ color: ERROR }}>*</span>
                  </label>

                  <select
                    id="field-city"
                    value={form.city}
                    aria-invalid={!!errors.city}
                    onChange={(e) =>
                      updateField("city", e.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{
                      border: errors.city
                        ? `1.5px solid ${ERROR}`
                        : "1px solid rgba(0,0,0,0.12)",
                      backgroundColor: WHITE,
                      color: form.city
                        ? BLACK
                        : "rgba(0,0,0,0.4)",
                    }}
                  >
                    <option value="" disabled>
                      Select...
                    </option>

                    {DELIVERY_ZONES.map((zone) => (
                      <option key={zone.name} value={zone.name}>
                        {zone.name} — {zone.fee} EGP
                      </option>
                    ))}
                  </select>

                  {errors.city && (
                    <p
                      role="alert"
                      className="mt-1.5 text-[11px] font-medium"
                      style={{ color: ERROR }}
                    >
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="field-country"
                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    Country <span style={{ color: ERROR }}>*</span>
                  </label>

                  <input
                    id="field-country"
                    value={form.country}
                    disabled
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{
                      border: errors.country
                        ? `1.5px solid ${ERROR}`
                        : "1px solid rgba(0,0,0,0.10)",
                      backgroundColor: SAND,
                      color: "rgba(0,0,0,0.55)",
                    }}
                  />

                  {errors.country && (
                    <p
                      role="alert"
                      className="mt-1.5 text-[11px] font-medium"
                      style={{ color: ERROR }}
                    >
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>

              <Field
                id="field-address"
                label="Address"
                required
                value={form.address}
                onChange={(v) => updateField("address", v)}
                error={errors.address}
                placeholder="Street, building, apartment"
              />

              <div>
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color: "rgba(0,0,0,0.6)",
                  }}
                >
                  Delivery Notes · Optional
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: WHITE,
                  }}
                />
              </div>

              {/* Payment */}
              <div
                className="mt-2 flex items-center gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: CREAM,
                }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: WHITE,
                    color: ACCENT,
                  }}
                >
                  ✓
                </div>

                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: BLACK }}
                  >
                    Cash on Delivery
                  </p>

                  <p
                    className="mt-0.5 text-[10px]"
                    style={{
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    Pay when your order arrives.
                  </p>
                </div>
              </div>

              {hasErrors && (
                <div
                  role="alert"
                  className="rounded-xl px-4 py-3 text-xs font-medium"
                  style={{
                    backgroundColor: "#FBEAE7",
                    border: `1px solid ${ERROR}`,
                    color: ERROR,
                  }}
                >
                  Please complete the highlighted fields to place
                  your order.
                </div>
              )}

              <button
                type="submit"
                className="mt-2 w-full rounded-full px-8 py-3.5 text-sm font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  backgroundColor: ACCENT,
                  color: WHITE,
                }}
              >
                Place Order
              </button>
            </form>
          </div>

          {/* ORDER SUMMARY */}
          <div
            className="h-fit rounded-3xl p-6 md:sticky md:top-6"
            style={{
              backgroundColor: WHITE,
              boxShadow: "0 10px 35px rgba(0,0,0,0.04)",
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: BLACK }}
            >
              Your Order
            </p>

            <div
              className="my-5 h-px"
              style={{
                backgroundColor: "rgba(0,0,0,0.08)",
              }}
            />

            <div className="flex flex-col">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3"
                  style={{
                    borderBottom:
                      "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
                    style={{
                      backgroundColor: SAND,
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: BLACK }}
                    >
                      {item.productName}
                    </p>

                    {(item.color || item.scent) && (
                      <p
                        className="truncate text-[10px]"
                        style={{
                          color: "rgba(0,0,0,0.5)",
                        }}
                      >
                        {[item.color, item.scent]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}

                    <p
                      className="text-[10px]"
                      style={{
                        color: "rgba(0,0,0,0.45)",
                      }}
                    >
                      × {item.quantity}
                    </p>
                  </div>

                  <span
                    className="text-xs font-semibold"
                    style={{ color: BLACK }}
                  >
                    {item.price * item.quantity} EGP
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span
                className="text-sm"
                style={{
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                Subtotal
              </span>

              <span
                className="text-sm font-semibold"
                style={{ color: BLACK }}
              >
                {subtotal} EGP
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span
                className="text-sm"
                style={{
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                Shipping
              </span>

              {selectedZone ? (
                <span
                  className="text-sm font-semibold"
                  style={{ color: BLACK }}
                >
                  {shippingFee} EGP
                </span>
              ) : (
                <span
                  className="text-[11px]"
                  style={{
                    color: "rgba(0,0,0,0.5)",
                  }}
                >
                  Select a delivery zone
                </span>
              )}
            </div>

            <div
              className="my-5 h-px"
              style={{
                backgroundColor: "rgba(0,0,0,0.08)",
              }}
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
                {grandTotal} EGP
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide"
        style={{
          color: "rgba(0,0,0,0.6)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: ERROR }}> *</span>
        )}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          border: error
            ? `1.5px solid ${ERROR}`
            : "1px solid rgba(0,0,0,0.12)",
          backgroundColor: WHITE,
          color: BLACK,
        }}
      />

      {error && (
        <p
          role="alert"
          className="mt-1.5 text-[11px] font-medium"
          style={{ color: ERROR }}
        >
          {error}
        </p>
      )}
    </div>
  );
}