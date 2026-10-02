"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";
import StatusPill from "../components/StatusPill";
import { collectCustomerImages } from "@/lib/customerImages";
import CustomerImageDownloads from "../components/CustomerImageDownloads";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";


// Matches StatusUpdater's vocabulary for custom_orders — using the
// same set here so both order types share one consistent workflow.
// If plain `orders` should use a different set, tell me and I'll split them.
const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;
// Which statuses make sense to filter by, per tab — keeps the dropdown
// from offering "completed" while on Active, etc., since that tab's
// own filter already excludes it and picking it would show nothing.
function statusOptionsForView(view: string): readonly string[] {
  if (view === "active") return STATUS_OPTIONS.filter((s) => s !== "completed" && s !== "cancelled");
  if (view === "cancelled") return ["cancelled"];
  if (view === "completed") return ["completed"];
  return STATUS_OPTIONS; // history: any status is possible (paid orders of any status)
}
const PAYMENT_OPTIONS = ["unpaid", "paid"] as const;

type Order = {
  id: string;
  order_no: number | null;
  order_code: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  governorate: string | null;
  address: string | null;
  items: CartItem[] | null;
  total: number | null;
  status: string | null;
  payment_status: string | null;
  completed_at: string | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
const [view, setView] = useState<"active" | "cancelled" | "completed" | "history">("active");
  useEffect(() => {
    loadOrders();
  }, []);
useEffect(() => {
  setStatusFilter("all");
}, [view]);
  async function loadOrders() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

 async function updateOrder(id: string, patch: Partial<Pick<Order, "status" | "payment_status">>) {
  setSavingId(id);

  const fullPatch: Partial<Pick<Order, "status" | "payment_status" | "completed_at">> = { ...patch };

  // Completed and Paid are treated as the same state — setting either
  // one also sets the other, and stamps completed_at so the Completed
  // tab knows when it happened (for the 1-week cutoff).
  if (patch.status === "completed") {
    fullPatch.payment_status = "paid";
    fullPatch.completed_at = new Date().toISOString();
  } else if (patch.payment_status === "paid") {
    fullPatch.status = "completed";
    fullPatch.completed_at = new Date().toISOString();
  }

  const supabase = createClient();
  const { error } = await supabase.from("orders").update(fullPatch).eq("id", id);

  if (error) {
    alert(`Couldn't save: ${error.message}`);
    setSavingId(null);
    return;
  }

  setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...fullPatch } : o)));
  setSavingId(null);
}
  async function deleteOrder(id: string) {
  if (!confirm("Delete this order? This can't be undone.")) return;

  setSavingId(id);

  const supabase = createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    alert(`Couldn't delete: ${error.message}`);
    setSavingId(null);
    return;
  }

  setOrders((prev) => prev.filter((o) => o.id !== id));
  setSavingId(null);
}

  const filtered = useMemo(() => {
  const q = search.trim().toLowerCase();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return orders.filter((o) => {
    const isCancelled = o.status === "cancelled";
    const isCompleted = o.status === "completed";
    const isPaid = o.payment_status === "paid";
    const completedRecently =
      isCompleted && o.completed_at && new Date(o.completed_at).getTime() >= oneWeekAgo;

    if (view === "cancelled" && !isCancelled) return false;
    if (view === "completed" && !completedRecently) return false;
    if (view === "history" && (isCancelled || !isPaid)) return false;
    if (view === "active" && (isCancelled || isCompleted || isPaid)) return false;

    if (statusFilter !== "all" && o.status !== statusFilter) return false;

    if (!q) return true;

    // "12", "#12" or "moon-12" = look up that exact order. Exact only,
    // because "1" would otherwise match every phone number containing a 1.
    const numberQuery = /^(moon-|#)?\d{1,5}$/.test(q)
      ? Number(q.replace(/^(moon-|#)/, ""))
      : null;
    if (numberQuery !== null) return o.order_no === numberQuery;

  const haystack = [o.order_code, o.customer_name, o.customer_phone, o.customer_email, o.id]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

    return haystack.includes(q);
  });
}, [orders, search, statusFilter, view]);

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
            Orders
          </h1>

          <button
            type="button"
            onClick={loadOrders}
            className="text-xs font-semibold underline"
            style={{ color: ACCENT }}
          >
            Refresh
          </button>
        </div>
<div className="flex gap-2 mb-4">
<button
  type="button"
  onClick={() => setView("active")}
  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
  style={{
    backgroundColor: view === "active" ? "#3F8F5C" : "transparent",
    color: view === "active" ? "#FFFFFF" : "#3F8F5C",
    border: "1.5px solid #3F8F5C",
  }}
>
  Active
</button>
<button
  type="button"
  onClick={() => setView("cancelled")}
  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
  style={{
    backgroundColor: view === "cancelled" ? "#A34848" : "transparent",
    color: view === "cancelled" ? "#FFFFFF" : "#A34848",
    border: "1.5px solid #A34848",
  }}
>
  Cancelled
</button>
<button
  type="button"
  onClick={() => setView("completed")}
  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
  style={{
    backgroundColor: view === "completed" ? "#3A6DB0" : "transparent",
    color: view === "completed" ? "#FFFFFF" : "#3A6DB0",
    border: "1.5px solid #3A6DB0",
  }}
>
  Completed
</button>
<button
  type="button"
  onClick={() => setView("history")}
  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
  style={{
    backgroundColor: view === "history" ? ACCENT : "transparent",
    color: view === "history" ? "#FFFFFF" : ACCENT,
    border: `1.5px solid ${ACCENT}`,
  }}
>
  History
</button>
</div>
{view === "completed" && (
  <p className="text-xs mb-4" style={{ color: MUTED }}>
    Completed orders will remain in the Completed column for one week after completion. After that, they can be found in History.
  </p>
)}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number (e.g. Moon-12), name, phone, or email"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          />

       <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="rounded-xl px-4 py-2.5 text-sm outline-none capitalize"
  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
>
  <option value="all">All statuses</option>
  {statusOptionsForView(view).map((s) => (
    <option key={s} value={s} className="capitalize">
      {s.replace("_", " ")}
    </option>
  ))}
</select>
        </div>

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading orders...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Couldn't load orders: {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {orders.length === 0 ? "No orders yet." : "No orders match your search."}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const isOpen = expandedId === order.id;
            const items = order.items ?? [];
            const itemCount = items.reduce((sum, it) => sum + (it.quantity ?? 1), 0);

            return (
              <div
                key={order.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex flex-col gap-0.5 min-w-[160px]">
                    <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                      {order.customer_name || "Unnamed customer"}
                      {order.order_code && (
                        <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>
                          {order.order_code}
                        </span>
                      )}
                    </span>
                    <span className="text-xs" style={{ color: MUTED }}>
                      {new Date(order.created_at).toLocaleString()} · {itemCount} item
                      {itemCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={order.status} />
                    <StatusPill status={order.payment_status ?? "unpaid"} />
                    <span className="text-sm font-bold ml-2" style={{ color: ACCENT }}>
                      {order.total ?? 0} LE
                    </span>
                    <span
                      className="text-xs ml-1 transition-transform"
                      style={{ color: MUTED, transform: isOpen ? "rotate(180deg)" : "none" }}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 flex flex-col gap-5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: ACCENT }}>
                          Contact
                        </p>
                        <p className="text-sm" style={{ color: "#000000" }}>
                          {order.customer_phone || "No phone"}
                        </p>
                        <p className="text-sm" style={{ color: "#000000" }}>
                          {order.customer_email || "No email"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: ACCENT }}>
                          Delivery
                        </p>
                        <p className="text-sm" style={{ color: "#000000" }}>
                          {order.governorate || "No governorate"}
                        </p>
                        <p className="text-sm" style={{ color: "#000000" }}>
                          {order.address || "No address"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] mb-2" style={{ color: ACCENT }}>
                        Items
                      </p>
                      <div className="flex flex-col gap-2">
                        {items.length === 0 && (
                          <p className="text-sm" style={{ color: MUTED }}>
                            No item details on this order.
                          </p>
                        )}
                        {items.map((item, i) => (
                          <div
                            key={`${item.id}-${i}`}
                            className="flex items-center gap-3 rounded-xl px-3 py-2"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "#000000" }}>
                                {item.productName}
                              </p>
                                <p className="text-xs" style={{ color: MUTED }}>
  {(() => {
    const colorLower = item.color?.trim().toLowerCase();

    if (colorLower === "unscented") {
      return "Unscented";
    }

    if (colorLower === "scented") {
      return item.scent ? `Scented — ${item.scent}` : "Scented";
    }

    const scentLabel = item.scent ? item.scent : "Unscented";
    return [item.color, item.option, scentLabel].filter(Boolean).join(" · ");
  })()}
</p>
                              {item.customization && (
                                <p className="text-xs italic" style={{ color: MUTED }}>
                                  Customized ({item.customization.type})
                                </p>
                              )}
                              <CustomerImageDownloads
  images={collectCustomerImages(item)}
  baseName={`${order.order_code ?? "order"}-${item.productName}`}
/>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                                x{item.quantity}
                              </p>
                              <p className="text-xs" style={{ color: MUTED }}>
                                {item.price} LE
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                        Status
                        <select
                          value={order.status ?? "pending"}
                          disabled={savingId === order.id}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                          className="rounded-lg px-2.5 py-1.5 text-sm outline-none capitalize"
                          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                        Payment
                        <select
                          value={order.payment_status ?? "unpaid"}
                          disabled={savingId === order.id}
                          onChange={(e) => updateOrder(order.id, { payment_status: e.target.value })}
                          className="rounded-lg px-2.5 py-1.5 text-sm outline-none"
                          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          {PAYMENT_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </label>

                    <button
  type="button"
  onClick={() => {
    if (confirm("Cancel this order?")) {
      updateOrder(order.id, { status: "cancelled" });
    }
  }}
  disabled={savingId === order.id || order.status === "cancelled"}
  className="text-xs font-semibold underline disabled:opacity-40"
  style={{ color: "#A34848" }}
>
  Cancel order
</button>

<button
  type="button"
  onClick={() => deleteOrder(order.id)}
  disabled={savingId === order.id}
  className="text-xs font-semibold underline ml-auto disabled:opacity-40"
  style={{ color: "#A34848" }}
>
  Delete order
</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}