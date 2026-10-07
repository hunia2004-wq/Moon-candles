"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

const ACCENT = "#DE4B33";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.08)";

type Item = {
  productName?: string;
  quantity?: number;
  price?: number;
  image?: string | null;
};

type Row = { name: string; units: number; revenue: number; image: string | null };

type OrderRow = { items: unknown; status: string | null; created_at: string };

function rank(orders: OrderRow[]): Row[] {
  const totals = new Map<string, Row>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;

    const items = Array.isArray(order.items) ? (order.items as Item[]) : [];

    for (const item of items) {
      const name = item.productName?.trim();
      if (!name) continue;

      const qty = Number(item.quantity ?? 1);
      const row = totals.get(name) ?? {
        name,
        units: 0,
        revenue: 0,
        image: item.image ?? null,
      };

      row.units += qty;
      row.revenue += Number(item.price ?? 0) * qty;
      if (!row.image && item.image) row.image = item.image;

      totals.set(name, row);
    }
  }

  return Array.from(totals.values()).sort(
    (a, b) => b.units - a.units || b.revenue - a.revenue
  );
}

export default function BestSellerCard() {
  const [lastRows, setLastRows] = useState<Row[]>([]);
  const [thisRows, setThisRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const thisMonthName = now.toLocaleString("en-US", { month: "long" });
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString(
    "en-US",
    { month: "long" }
  );

  async function load(silent = false) {
    if (!silent) setLoading(true);

    const today = new Date();
    const lastStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("items, status, created_at")
      .gte("created_at", lastStart.toISOString());

    if (error) {
      if (!silent) setError(error.message);
      setLoading(false);
      return;
    }

    const lastOrders: OrderRow[] = [];
    const thisOrders: OrderRow[] = [];

    for (const order of (data ?? []) as OrderRow[]) {
      if (new Date(order.created_at).getTime() >= thisStart.getTime()) {
        thisOrders.push(order);
      } else {
        lastOrders.push(order);
      }
    }

    setLastRows(rank(lastOrders).slice(0, 3));
    setThisRows(rank(thisOrders).slice(0, 1));
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useAutoRefresh(() => load(true));

  const winner = lastRows[0];
  const runnersUp = lastRows.slice(1);
  const leader = thisRows[0];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* LAST MONTH — the official best seller */}
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: ACCENT }}
      >
        Best seller · {lastMonthName}
      </p>

      {loading && (
        <p className="text-sm" style={{ color: MUTED }}>
          Loading...
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: "#A34848" }}>
          Couldn't load: {error}
        </p>
      )}

      {!loading && !error && !winner && (
        <p className="text-sm" style={{ color: MUTED }}>
          No orders in {lastMonthName}.
        </p>
      )}

      {winner && (
        <>
          <div className="flex items-center gap-4">
            {winner.image && (
              <img
                src={winner.image}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                style={{ border: `1px solid ${BORDER}` }}
              />
            )}

            <div className="min-w-0 flex-1">
              <p
                className="truncate font-serif text-2xl font-bold"
                style={{ color: "#000000" }}
              >
                {winner.name}
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                {winner.units} sold · {winner.revenue.toLocaleString()} LE
              </p>
            </div>
          </div>

          {runnersUp.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {runnersUp.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-sm">
                  <span style={{ color: "#000000" }}>
                    <span style={{ color: MUTED }}>{i + 2}.</span> {r.name}
                  </span>
                  <span style={{ color: MUTED }}>{r.units} sold</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* THIS MONTH — still in progress */}
      {!loading && !error && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: "1px dashed rgba(0,0,0,0.15)" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: MUTED }}
            >
              {thisMonthName}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
            >
              In progress
            </span>
          </div>

          {leader ? (
            <p className="text-sm" style={{ color: "#000000" }}>
              Leading so far: <span className="font-semibold">{leader.name}</span>{" "}
              <span style={{ color: MUTED }}>· {leader.units} sold</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>
              No orders yet this month.
            </p>
          )}
        </div>
      )}
    </div>
  );
}