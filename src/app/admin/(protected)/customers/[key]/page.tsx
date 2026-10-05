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

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
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
            <h1 className="text-3xl font-serif font-bold mb-5" style={{ color: "#000000" }}>
              {name}
            </h1>

            <div
              className="mb-6 grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-2"
              style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                  Contact
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {phone || "No phone"}
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {email || "No email"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                  Last delivery details
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {governorate || "No governorate"}
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {address || "No address"}
                </p>
              </div>

              <div className="flex gap-8 sm:col-span-2">
                <div>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Orders
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                    {orderCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Spent
                  </p>
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>
                    {totalSpent.toLocaleString()} LE
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Last order
                  </p>
                  <p className="text-xs" style={{ color: "#000000" }}>
                    {lastOrderAt ? formatDate(lastOrderAt) : "—"}
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-3 text-[11px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Orders ({orders.length})
            </p>

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
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                          {o.order_code ?? "Order"}
                        </p>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {formatDate(o.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill status={o.status} />
                        <StatusPill status={o.payment_status ?? "unpaid"} />
                        <span className="ml-2 text-sm font-bold" style={{ color: ACCENT }}>
                          {Number(o.total ?? 0).toLocaleString()} LE
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-1">
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

            <p className="mb-3 text-[11px] uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              Custom candles ({customOrders.length})
            </p>

            <div className="flex flex-col gap-3">
              {customOrders.length === 0 && (
                <p className="text-sm" style={{ color: MUTED }}>
                  No custom candles.
                </p>
              )}

              {customOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                        {o.order_code ?? "Custom Candle"}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {formatDate(o.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPill status={o.status} />
                      <span className="ml-2 text-sm font-bold" style={{ color: ACCENT }}>
                        {Number(o.price ?? 0).toLocaleString()} LE
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs" style={{ color: "#000000" }}>
                    {o.size_label} · {o.scent || "No scent chosen"}
                  </p>
                  <p className="text-xs italic" style={{ color: MUTED }}>
                    {o.message ? `"${o.message}"` : "No message"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}