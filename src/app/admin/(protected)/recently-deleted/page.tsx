"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const TONE = "#DE4B33";
const GREEN = "#3F8F5C";
const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type Table = "products" | "orders" | "custom_orders";

type Item = {
  key: string;
  table: Table;
  id: string | number;
  title: string;
  subtitle: string;
  amount: number | null;
  image: string | null;
  deletedAt: string;
};

function daysLeft(deletedAt: string) {
  const left = new Date(deletedAt).getTime() + RETENTION_DAYS * DAY_MS - Date.now();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

export default function RecentlyDeletedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();

    // Anything that has been in here longer than the retention period is removed for good.
    await Promise.all(
      (["products", "orders", "custom_orders"] as Table[]).map((t) =>
        supabase.from(t).delete().lt("deleted_at", cutoff)
      )
    );

    const [p, o, c] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, image_urls, colors, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("orders")
        .select("id, order_code, customer_name, total, deleted_at")
        .not("deleted_at", "is", null),
      supabase
        .from("custom_orders")
        .select("id, order_code, customer_name, price, size_label, deleted_at")
        .not("deleted_at", "is", null),
    ]);

    const failed = p.error || o.error || c.error;
    if (failed) {
      setError(failed.message);
      setLoading(false);
      return;
    }

    const list: Item[] = [
      ...(p.data ?? []).map((r: any) => ({
        key: `products-${r.id}`,
        table: "products" as Table,
        id: r.id,
        title: r.name,
        subtitle: "Product",
        amount: r.price != null ? Number(r.price) : null,
        image:
          r.image_urls?.[0] ?? r.colors?.[0]?.image_urls?.[0] ?? r.colors?.[0]?.image_url ?? null,
        deletedAt: r.deleted_at,
      })),
      ...(o.data ?? []).map((r: any) => ({
        key: `orders-${r.id}`,
        table: "orders" as Table,
        id: r.id,
        title: r.customer_name || "Unnamed customer",
        subtitle: r.order_code ?? "Order",
        amount: r.total != null ? Number(r.total) : null,
        image: null,
        deletedAt: r.deleted_at,
      })),
      ...(c.data ?? []).map((r: any) => ({
        key: `custom_orders-${r.id}`,
        table: "custom_orders" as Table,
        id: r.id,
        title: r.customer_name || "Unnamed customer",
        subtitle: `${r.order_code ?? "Custom candle"}${r.size_label ? " - " + r.size_label : ""}`,
        amount: r.price != null ? Number(r.price) : null,
        image: null,
        deletedAt: r.deleted_at,
      })),
    ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    setItems(list);
    setLoading(false);
  }

  async function restore(item: Item) {
    setBusyKey(item.key);
    const supabase = createClient();
    const { error } = await supabase.from(item.table).update({ deleted_at: null }).eq("id", item.id);

    if (error) {
      alert("Could not restore: " + error.message);
      setBusyKey(null);
      return;
    }

    setItems((prev) => prev.filter((i) => i.key !== item.key));
    setBusyKey(null);
  }

  async function deleteForever(item: Item) {
    if (!confirm("Delete this for good? This cannot be undone.")) return;

    setBusyKey(item.key);
    const supabase = createClient();
    const { error } = await supabase.from(item.table).delete().eq("id", item.id);

    if (error) {
      alert("Could not delete: " + error.message);
      setBusyKey(null);
      return;
    }

    setItems((prev) => prev.filter((i) => i.key !== item.key));
    setBusyKey(null);
  }

  const productItems = items.filter((i) => i.table === "products");
  const orderItems = items.filter((i) => i.table !== "products");
  const shown = tab === "products" ? productItems : orderItems;

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-4 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
              Recently Deleted
            </h1>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              Items stay here for {RETENTION_DAYS} days, then they are removed for good.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="self-start text-xs font-semibold underline"
            style={{ color: ACCENT }}
          >
            Refresh
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:flex">
          {(
            [
              { id: "products", label: "Products", n: productItems.length },
              { id: "orders", label: "Orders", n: orderItems.length },
            ] as const
          ).map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="rounded-full px-5 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: on ? TONE : "transparent",
                  color: on ? "#FFFFFF" : TONE,
                  border: `1.5px solid ${TONE}`,
                }}
              >
                {t.label} ({t.n})
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading...
          </p>
        )}

        {error && (
          <p className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Could not load: {error}
          </p>
        )}

        {!loading && !error && shown.length === 0 && (
          <div
            className="rounded-2xl px-5 py-10 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            Nothing here. Deleted items wait here for {RETENTION_DAYS} days before they are removed for good.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {shown.map((item) => {
            const left = daysLeft(item.deletedAt);
            const urgent = left <= 5;
            const busy = busyKey === item.key;

            return (
              <div
                key={item.key}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: CARD_BG,
                  border: "1px solid rgba(0,0,0,0.08)",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-bold leading-tight" style={{ color: "#000000" }}>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                      {item.subtitle}
                      {item.amount != null ? " - " + item.amount.toLocaleString() + " LE" : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold" style={{ color: urgent ? ACCENT : MUTED }}>
                      Deleted{" "}
                      {new Date(item.deletedAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      - {left} day{left !== 1 ? "s" : ""} left
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => restore(item)}
                    className="rounded-full py-2.5 text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteForever(item)}
                    className="rounded-full py-2.5 text-sm font-semibold disabled:opacity-50"
                    style={{ border: "1.5px solid rgba(0,0,0,0.25)", color: "#000000" }}
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
