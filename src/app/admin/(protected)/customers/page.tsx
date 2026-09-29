"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const [ordersRes, customOrdersRes] = await Promise.all([
      supabase.from("orders").select("customer_name, customer_phone, customer_email, total, created_at"),
      supabase.from("custom_orders").select("customer_name, customer_phone, customer_email, price, created_at"),
    ]);

    if (ordersRes.error) {
      setError(ordersRes.error.message);
      setLoading(false);
      return;
    }

    const rows = [
      ...(ordersRes.data ?? []).map((o) => ({ ...o, amount: Number(o.total ?? 0) })),
      ...(customOrdersRes.data ?? []).map((o) => ({ ...o, amount: Number(o.price ?? 0) })),
    ];

    const byCustomer = new Map<string, Customer>();

    for (const r of rows) {
      const key = r.customer_phone || r.customer_email || r.customer_name || "unknown";
      const existing = byCustomer.get(key);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += r.amount;
        if (new Date(r.created_at) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = r.created_at;
        }
      } else {
        byCustomer.set(key, {
          key,
          name: r.customer_name || "Unnamed customer",
          phone: r.customer_phone || "—",
          email: r.customer_email || "—",
          orderCount: 1,
          totalSpent: r.amount,
          lastOrderAt: r.created_at,
        });
      }
    }

    const list = Array.from(byCustomer.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );

    setCustomers(list);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) =>
      [c.name, c.phone, c.email].join(" ").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
            Customers
          </h1>
          <button
            type="button"
            onClick={loadCustomers}
            className="text-xs font-semibold underline"
            style={{ color: ACCENT }}
          >
            Refresh
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email"
          className="w-full mb-6 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
        />

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading customers...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Couldn't load customers: {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {customers.length === 0 ? "No customers yet." : "No customers match your search."}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Link
              key={c.key}
              href={`/admin/customers/${encodeURIComponent(c.key)}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
              style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="flex flex-col gap-0.5 min-w-[160px]">
                <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                  {c.name}
                </span>
                <span className="text-xs" style={{ color: MUTED }}>
                  {c.phone !== "—" ? c.phone : c.email}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs" style={{ color: MUTED }}>
                    Orders
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                    {c.orderCount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: MUTED }}>
                    Spent
                  </p>
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>
                    {c.totalSpent.toLocaleString()} LE
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: MUTED }}>
                    Last order
                  </p>
                  <p className="text-xs" style={{ color: "#000000" }}>
                    {new Date(c.lastOrderAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}