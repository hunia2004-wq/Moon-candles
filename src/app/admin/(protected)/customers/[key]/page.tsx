"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StatusPill from "../../components/StatusPill";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

// Same rules the Customers list uses, so a customer's page always
// finds the same orders the list counted for them.
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[\s-]/g, "");
  const match = digits.match(/^(?:\+?20|0)?(1[0125]\d{8})$/);
  return match ? match[1] : digits || null;
}

function customerKey(r: any): string {
  return (
    normalizePhone(r.customer_phone) ||
    r.customer_email?.trim().toLowerCase() ||
    r.customer_name?.trim().toLowerCase() ||
    "unknown"
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { timeZone: "Africa/Cairo" });
}
function formatShort(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneForStatus(status: string | null): string {
  if (status === "cancelled") return "#A34848";
  if (status === "completed") return "#3A6DB0";
  if (status === "pending") return "#D08A1E";
  return "#3F8F5C";
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ key: string }>();

  const key = (() => {
    try {
      return decodeURIComponent(String(params.key ?? ""));
    } catch {
      return String(params.key ?? "");
    }
  })();

  const [orders, setOrders] = useState<any[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const [ordersRes, customRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("custom_orders").select("*").order("created_at", { ascending: false }),
      ]);

      if (ordersRes.error) {
        setError(ordersRes.error.message);
        setLoading(false);
        return;
      }

      if (customRes.error) {
        console.error("Couldn't load custom orders:", customRes.error.message);
      }

      setOrders((ordersRes.data ?? []).filter((o) => customerKey(o) === key));
      setCustomOrders((customRes.data ?? []).filter((o) => customerKey(o) === key));
      setLoading(false);
    }

    load();
  }, [key]);

  // Details come from the newest order that has them filled in.
  const all = [...orders, ...customOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const pick = (field: string) => all.find((r) => r[field])?.[field] ?? null;

  const name = pick("customer_name") ?? "Unnamed customer";
  const phone = pick("customer_phone");
  const email = pick("customer_email");
  const governorate = orders.find((o) => o.governorate)?.governorate ?? null;
  const address = orders.find((o) => o.address)?.address ?? null;

  const totalSpent =
    orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0) +
    customOrders.reduce((sum, o) => sum + Number(o.price ?? 0), 0);

  const orderCount = orders.length + customOrders.length;
  const lastOrderAt = all[0]?.created_at ?? null;
    // Custom candles placed through checkout live inside orders.items,
  // not in the custom_orders table.
  const candleItems = orders.flatMap((o) =>
    (Array.isArray(o.items) ? o.items : [])
      .filter(
        (item: any) =>
          item.customization?.type === "customized-candle" ||
          item.productName === "Custom Candle"
      )
      .map((item: any, i: number) => ({ order: o, item, key: `${o.id}-${i}` }))
  );

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-4 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <Link
          href="/admin/customers"
          className="mb-5 inline-block text-xs font-semibold underline"
          style={{ color: ACCENT }}
        >
          ← All customers
        </Link>

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading customer...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Couldn't load this customer: {error}
          </p>
        )}

        {!loading && !error && orderCount === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            No orders found for this customer.
          </div>
        )}

        {!loading && !error && orderCount > 0 && (
          <>
                        <div
              className="mb-6 overflow-hidden rounded-2xl"
              style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {/* header band */}
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ backgroundColor: "#EFE3C4" }}
              >
                <h1 className="truncate font-serif text-2xl font-bold" style={{ color: "#000000" }}>
                  {name}
                </h1>
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: orderCount >= 3 ? "#8FAA8233" : "#6E86C733",
                    color: orderCount >= 3 ? "#47684b" : "#3A5A9E",
                  }}
                >
                  {orderCount >= 3 ? "Repeat customer" : "New customer"}
                </span>
              </div>

              {/* contact + delivery */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 px-4 py-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    <span className="w-14 flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                      Phone
                    </span>
                    <span className="text-xs" style={{ color: "#000000" }}>
                      {phone || "No phone"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="w-14 flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                      Email
                    </span>
                    <span className="min-w-0 truncate text-xs" style={{ color: "#000000" }}>
                      {email || "No email"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    <span className="w-14 flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                      Area
                    </span>
                    <span className="text-xs" style={{ color: "#000000" }}>
                      {governorate || "No governorate"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="w-14 flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                      Address
                    </span>
                    <span className="text-xs" style={{ color: "#000000" }}>
                      {address || "No address"}
                    </span>
                  </div>
                </div>
              </div>

              {/* stats strip */}
              <div
                className="grid grid-cols-3 divide-x"
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.08)",
                  borderColor: "rgba(0,0,0,0.08)",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div className="px-3 py-2.5 text-center">
                  <p className="font-serif text-lg font-bold leading-none" style={{ color: "#000000" }}>
                    {orderCount}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                    Orders
                  </p>
                </div>
                <div className="px-3 py-2.5 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <p className="font-serif text-lg font-bold leading-none" style={{ color: ACCENT }}>
                    {totalSpent.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                    LE spent
                  </p>
                </div>
                <div className="px-3 py-2.5 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <p className="font-serif text-lg font-bold leading-none" style={{ color: "#000000" }}>
                    {lastOrderAt
                      ? new Date(lastOrderAt).toLocaleDateString("en-GB", {
                          timeZone: "Africa/Cairo",
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                    Last order
                  </p>
                </div>
              </div>
            </div>

                       <div className="mb-3 flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold" style={{ color: "#000000" }}>
                Orders
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
              >
                {orders.length}
              </span>
            </div>

            <div className="mb-8 flex flex-col gap-3">
              {orders.length === 0 && (
                <p className="text-sm" style={{ color: MUTED }}>
                  No regular orders.
                </p>
              )}

                           {orders.map((o) => {
                const items: any[] = Array.isArray(o.items) ? o.items : [];

                return (
                  <div
                    key={o.id}
                    className="relative overflow-hidden rounded-2xl py-3.5 pl-5 pr-4"
                    style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <span
                      className="absolute left-0 top-0 h-full w-1.5"
                      style={{ backgroundColor: toneForStatus(o.status) }}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-base font-bold" style={{ color: "#000000" }}>
                          {o.order_code ?? "Order"}
                        </p>
                        <p className="text-[11px]" style={{ color: MUTED }}>
                          {formatShort(o.created_at)}
                        </p>
                      </div>
                      <span className="font-serif text-lg font-bold leading-none" style={{ color: ACCENT }}>
                        {Number(o.total ?? 0).toLocaleString()}
                        <span className="ml-1 text-[11px] font-semibold">LE</span>
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <StatusPill status={o.status} />
                      <StatusPill status={o.payment_status ?? "unpaid"} />
                    </div>

                    <div
                      className="mt-2.5 flex flex-col gap-0.5 pt-2.5"
                      style={{ borderTop: "1px dashed rgba(0,0,0,0.15)" }}
                    >
                      {items.map((item, i) => (
                        <p key={i} className="text-xs" style={{ color: "#000000" }}>
                          x{item.quantity ?? 1} · {item.productName}
                          {item.color ? ` · ${item.color}` : ""}
                          {item.scent ? ` · ${item.scent}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

                       <div className="mb-3 flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold" style={{ color: "#000000" }}>
                Custom candles
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "#D8A1AF33", color: "#B5677C" }}
              >
                {customOrders.length + candleItems.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
                            {customOrders.length === 0 && candleItems.length === 0 && (
                <p className="text-sm" style={{ color: MUTED }}>
                  No custom candles.
                </p>
              )}

                                       {candleItems.map(({ order, item, key }) => (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-2xl py-3.5 pl-5 pr-4"
                  style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <span
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ backgroundColor: toneForStatus(order.status) }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-base font-bold" style={{ color: "#000000" }}>
                        {order.order_code ?? "Custom Candle"}
                      </p>
                      <p className="text-[11px]" style={{ color: MUTED }}>
                        {formatShort(order.created_at)}
                      </p>
                    </div>
                    <span className="font-serif text-lg font-bold leading-none" style={{ color: ACCENT }}>
                      {(Number(item.price ?? 0) * Number(item.quantity ?? 1)).toLocaleString()}
                      <span className="ml-1 text-[11px] font-semibold">LE</span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusPill status={order.status} />
                  </div>

                  <div
                    className="mt-2.5 flex flex-col gap-0.5 pt-2.5"
                    style={{ borderTop: "1px dashed rgba(0,0,0,0.15)" }}
                  >
                    <p className="text-xs" style={{ color: "#000000" }}>
                      x{item.quantity ?? 1}
                      {item.color ? ` · ${item.color}` : ""}
                      {item.scent ? ` · ${item.scent}` : ""}
                    </p>
                  </div>
                </div>
              ))}

              {customOrders.map((o) => (
                <div
                  key={o.id}
                  className="relative overflow-hidden rounded-2xl py-3.5 pl-5 pr-4"
                  style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <span
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ backgroundColor: toneForStatus(o.status) }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-base font-bold" style={{ color: "#000000" }}>
                        {o.order_code ?? "Custom Candle"}
                      </p>
                      <p className="text-[11px]" style={{ color: MUTED }}>
                        {formatShort(o.created_at)}
                      </p>
                    </div>
                    <span className="font-serif text-lg font-bold leading-none" style={{ color: ACCENT }}>
                      {Number(o.price ?? 0).toLocaleString()}
                      <span className="ml-1 text-[11px] font-semibold">LE</span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusPill status={o.status} />
                  </div>

                  <div
                    className="mt-2.5 flex flex-col gap-0.5 pt-2.5"
                    style={{ borderTop: "1px dashed rgba(0,0,0,0.15)" }}
                  >
                    <p className="text-xs" style={{ color: "#000000" }}>
                      {o.size_label} · {o.scent || "No scent chosen"}
                    </p>
                    <p className="text-xs italic" style={{ color: MUTED }}>
                      {o.message ? `"${o.message}"` : "No message"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}