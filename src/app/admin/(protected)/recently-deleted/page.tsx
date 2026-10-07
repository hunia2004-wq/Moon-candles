"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAdminActivity } from "@/lib/logAdminActivity";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type Table = "products" | "orders" | "custom_orders" | "scent_catalog";
type Kind = "products" | "orders" | "scents";

type Item = {
  key: string;
  kind: Kind;
  targets: { table: Table; ids: (string | number)[] }[];
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

function logItem(item: Item, verb: "restored" | "deleted_forever") {
  const prefix = item.kind === "products" ? "product" : item.kind === "scents" ? "scent" : "order";
  const entityType =
    item.kind === "products"
      ? "product"
      : item.kind === "scents"
      ? "scent"
      : item.key.startsWith("custom_orders")
      ? "custom_order"
      : "order";
  logAdminActivity({
    action: `${prefix}.${verb}`,
    entityType,
    entityId: item.key,
    entityLabel: item.kind === "orders" ? `${item.subtitle} - ${item.title}` : item.title,
  });
}

export default function RecentlyDeletedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Kind>("products");
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
      (["products", "orders", "custom_orders", "scent_catalog"] as Table[]).map((t) =>
        supabase.from(t).delete().lt("deleted_at", cutoff)
      )
    );

    const [p, o, c, sc] = await Promise.all([
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
      supabase
        .from("scent_catalog")
        .select("name, deleted_at, deleted_product_ids")
        .not("deleted_at", "is", null),
    ]);

    const failed = p.error || o.error || c.error || sc.error;
    if (failed) {
      setError(failed.message);
      setLoading(false);
      return;
    }

    const list: Item[] = [];

    (p.data ?? []).forEach((r: any) => {
      list.push({
        key: `products-${r.id}`,
        kind: "products",
        targets: [{ table: "products", ids: [r.id] }],
        title: r.name,
        subtitle: "Product",
        amount: r.price != null ? Number(r.price) : null,
        image:
          r.image_urls?.[0] ?? r.colors?.[0]?.image_urls?.[0] ?? r.colors?.[0]?.image_url ?? null,
        deletedAt: r.deleted_at,
      });
    });

    [
      ...(o.data ?? []).map((r: any) => ({ ...r, _table: "orders" as Table, _amount: r.total })),
      ...(c.data ?? []).map((r: any) => ({ ...r, _table: "custom_orders" as Table, _amount: r.price })),
    ].forEach((r: any) => {
      list.push({
        key: `${r._table}-${r.id}`,
        kind: "orders",
        targets: [{ table: r._table, ids: [r.id] }],
        title: r.customer_name || "Unnamed customer",
        subtitle:
          r._table === "custom_orders"
            ? `${r.order_code ?? "Custom candle"}${r.size_label ? " - " + r.size_label : ""}`
            : r.order_code ?? "Order",
        amount: r._amount != null ? Number(r._amount) : null,
        image: null,
        deletedAt: r.deleted_at,
      });
    });

    (sc.data ?? []).forEach((r: any) => {
      const n = (r.deleted_product_ids ?? []).length;
      list.push({
        key: `scents-${r.name}`,
        kind: "scents",
        targets: [{ table: "scent_catalog", ids: [r.name] }],
        title: r.name,
        subtitle: `Scent - was on ${n} product${n !== 1 ? "s" : ""}`,
        amount: null,
        image: null,
        deletedAt: r.deleted_at,
      });
    });

    list.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    setItems(list);
    setLoading(false);
  }

  async function restore(item: Item) {
    setBusyKey(item.key);
    const supabase = createClient();

    for (const t of item.targets) {
      if (t.table === "scent_catalog") {
        for (const name of t.ids) {
          const { error } = await supabase.rpc("restore_scent", { p_name: name });
          if (!error)
            logAdminActivity({
              action: "scent.restored",
              entityType: "scent",
              entityId: String(name),
              entityLabel: String(name),
            });
          if (error) {
            alert("Could not restore: " + error.message);
            setBusyKey(null);
            return;
          }
        }
        continue;
      }

      const patch =
        t.table === "products"
          ? { deleted_at: null }
          : { deleted_at: null, deleted_with_customer: false };
      const { error } = await supabase.from(t.table).update(patch).in("id", t.ids);

      if (error) {
        alert("Could not restore: " + error.message);
        setBusyKey(null);
        return;
      }
    }

    if (item.kind !== "scents") logItem(item, "restored"); // scent restores are logged above
    setItems((prev) => prev.filter((i) => i.key !== item.key));
    setBusyKey(null);
  }

  async function deleteForever(item: Item) {
    if (!confirm("Delete this for good? This cannot be undone.")) return;

    setBusyKey(item.key);
    const supabase = createClient();

    for (const t of item.targets) {
      const col = t.table === "scent_catalog" ? "name" : "id";
      const { error } = await supabase.from(t.table).delete().in(col, t.ids);

      if (error) {
        alert("Could not delete: " + error.message);
        setBusyKey(null);
        return;
      }
    }

    logItem(item, "deleted_forever");
    setItems((prev) => prev.filter((i) => i.key !== item.key));
    setBusyKey(null);
  }

  const tabs: { id: Kind; label: string }[] = [
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "scents", label: "Scents" },
  ];
  const shown = items.filter((i) => i.kind === tab);

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

        <div className="mb-5 grid grid-cols-3 gap-2 sm:flex">
          {tabs.map((t) => {
            const on = tab === t.id;
            const n = items.filter((i) => i.kind === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-5"
                style={{
                  backgroundColor: on ? ACCENT : "transparent",
                  color: on ? "#FFF4E6" : ACCENT,
                  border: `1.5px solid ${ACCENT}`,
                }}
              >
                {t.label} ({n})
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
