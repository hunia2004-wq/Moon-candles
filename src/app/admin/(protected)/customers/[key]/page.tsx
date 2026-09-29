"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import StatusPill from "../../components/StatusPill";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

type TimelineEntry = {
  id: string;
  kind: "Order" | "Custom";
  amount: number;
  status: string;
  created_at: string;
  detail: string | null;
};

export default function CustomerDetailPage() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(params.key);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function loadCustomer() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const filter = `customer_phone.eq.${key},customer_email.eq.${key},customer_name.eq.${key}`;

    const [ordersRes, customOrdersRes] = await Promise.all([
      supabase.from("orders").select("*").or(filter),
      supabase.from("custom_orders").select("*").or(filter),
    ]);

    if (ordersRes.error) {
      setError(ordersRes.error.message);
      setLoading(false);
      return;
    }

    const orders = ordersRes.data ?? [];
    const customOrders = customOrdersRes.data ?? [];

    if (orders.length === 0 && customOrders.length === 0) {
      setError("No customer found.");
      setLoading(false);
      return;
    }

    const first = orders[0] ?? customOrders[0];
    setName(first.customer_name || "Unnamed customer");
    setPhone(first.customer_phone || "—");
    setEmail(first.customer_email || "—");
    setAddress(first.address || "");
    setGovernorate(first.governorate || "");

    const combined: TimelineEntry[] = [
      ...orders.map((o) => ({
        id: o.id,
        kind: "Order" as const,
        amount: Number(o.total ?? 0),
        status: o.status,
        created_at: o.created_at,
        detail: null,
      })),
      ...customOrders.map((o) => ({
        id: o.id,
        kind: "Custom" as const,
        amount: Number(o.price ?? 0),
        status: o.status,
        created_at: o.created_at,
        detail: o.size_label,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setTimeline(combined);
    setLoading(false);
  }

  const totalSpent = timeline.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-2xl mx-auto">
        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <h1 className="text-3xl font-serif font-bold mb-1" style={{ color: "#000000" }}>
              {name}
            </h1>
            <p className="text-xs mb-8" style={{ color: MUTED }}>
              {timeline.length} order{timeline.length === 1 ? "" : "s"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <SummaryCard label="Total orders" value={timeline.length.toString()} />
              <SummaryCard label="Total spent" value={`${totalSpent.toLocaleString()} LE`} />
              <SummaryCard label="Contact" value={phone !== "—" ? phone : email} />
            </div>

            {address && (
              <div
                className="rounded-2xl p-5 mb-8"
                style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: MUTED }}>
                  Last known address
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {address}
                  {governorate ? `, ${governorate}` : ""}
                </p>
              </div>
            )}

            <h2 className="text-xl font-serif font-bold mb-4" style={{ color: "#000000" }}>
              Order history
            </h2>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {timeline.map((t) => (
                <Link
                  key={`${t.kind}-${t.id}`}
                  href={t.kind === "Custom" ? `/admin/custom-orders/${t.id}` : "/admin/orders"}
                  className="flex items-center justify-between px-5 py-3.5 text-sm"
                  style={{ backgroundColor: CARD_BG, borderTop: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div>
                    <span className="font-medium" style={{ color: "#000000" }}>
                      {t.kind === "Custom" ? `Custom · ${t.detail}` : "Order"}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: MUTED }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={t.status} />
                    <span className="font-semibold" style={{ color: "#000000" }}>
                      {t.amount.toLocaleString()} LE
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="font-serif text-lg font-bold truncate" style={{ color: "#000000" }}>
        {value}
      </p>
    </div>
  );
}