"use client";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";
import StatusPill from "../components/StatusPill";
import { collectCustomerImages, candleTextNote } from "@/lib/customerImages";
import CustomerImageDownloads from "../components/CustomerImageDownloads";
import { printPackingSlip } from "@/lib/packingSlip";
import { exportOrdersCsv } from "@/lib/exportOrders";
import { customizationNote } from "@/lib/customizationNote";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.08)";
const PANEL_CLASS = "rounded-xl px-4 py-3";
const PANEL_STYLE = { backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}` };
const LABEL_CLASS = "text-[11px] font-semibold uppercase tracking-[0.15em] mb-1.5";
const FIELD_STYLE = {
  border: "1.5px solid rgba(0,0,0,0.15)",
  backgroundColor: "#FFFFFF",
  color: "#000000",
};


// Matches StatusUpdater's vocabulary for custom_orders — using the
// same set here so both order types share one consistent workflow.
// If plain `orders` should use a different set, tell me and I'll split them.
const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
] as const;

const ASSIGNEE_OPTIONS = ["Jana", "Nour"] as const;
// Which statuses make sense to filter by, per tab — keeps the dropdown
// from offering "completed" while on Active, etc., since that tab's
// own filter already excludes it and picking it would show nothing.
function statusOptionsForView(view: string): readonly string[] {
  if (view === "active") {
    return STATUS_OPTIONS.filter((s) => s !== "completed");
  }

  if (view === "cancelled") {
    return STATUS_OPTIONS;
  }

  if (view === "completed") {
    return ["completed"];
  }

  return STATUS_OPTIONS;
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
  assignee: string | null;
  shipping_fee: number | null;
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
  useAutoRefresh(() => loadOrders(true));
useEffect(() => {
  setStatusFilter("all");
}, [view]);
   async function loadOrders(silent = false) {
    if (!silent) setLoading(true);
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

async function updateOrder(id: string, patch: Partial<Pick<Order, "status" | "payment_status" | "assignee">>) {
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
<div className="px-4 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 mb-6">
                  <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
              Orders
            </h1>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              {filtered.length} order{filtered.length !== 1 ? "s" : ""} in this view
            </p>
          </div>

                            <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => exportOrdersCsv(filtered, view)}
              disabled={filtered.length === 0}
              className="text-xs font-semibold underline disabled:opacity-40"
              style={{ color: ACCENT }}
            >
              Export CSV ({filtered.length})
            </button>

            <button
              type="button"
              onClick={() => loadOrders()}
              className="text-xs font-semibold underline"
              style={{ color: ACCENT }}
            >
              Refresh
            </button>
          </div>
        </div>
<div className="grid grid-cols-4 gap-1.5 mb-4 sm:flex sm:gap-2 [&>button]:px-1 [&>button]:text-[11px] [&>button]:whitespace-nowrap sm:[&>button]:px-4 sm:[&>button]:text-xs">
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
       backgroundColor: view === "history" ? "#7A6A58" : "transparent",
    color: view === "history" ? "#FFFFFF" : "#7A6A58",
    border: "1.5px solid #7A6A58",
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
                  className="relative w-full flex flex-col gap-3 pl-6 pr-4 py-4 text-left sm:pr-5"
                >
                  {/* status stripe down the left edge */}
                  <span
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{
                      backgroundColor:
                        order.status === "cancelled"
                          ? "#A34848"
                          : order.status === "completed"
                          ? "#3A6DB0"
                          : order.status === "pending"
                                                    ? "#D08A1E"
                          : "#3F8F5C",
                    }}
                  />

                  <div className="flex items-center gap-3">
                    {/* ticket-stub order number */}
                    <span
                      className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#EFE3C4", border: "1.5px dashed rgba(0,0,0,0.25)" }}
                    >
                      <span
                        className="text-[8px] font-semibold uppercase tracking-[0.2em]"
                        style={{ color: MUTED }}
                      >
                        Moon
                      </span>
                      <span className="font-serif text-xl font-bold leading-none" style={{ color: "#000000" }}>
                        {order.order_no ?? "–"}
                      </span>
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold" style={{ color: "#000000" }}>
                        {order.customer_name || "Unnamed customer"}
                      </span>
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
                        {new Date(order.created_at).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                      <span className="font-serif text-xl font-bold leading-none" style={{ color: ACCENT }}>
                        {order.total ?? 0}
                        <span className="ml-1 text-[11px] font-semibold">LE</span>
                      </span>
                      <span
                        className="text-xs transition-transform"
                        style={{ color: MUTED, transform: isOpen ? "rotate(180deg)" : "none" }}
                      >
                        ▾
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap items-center gap-2 pt-3"
                    style={{ borderTop: "1px dashed rgba(0,0,0,0.15)" }}
                  >
                    <StatusPill status={order.status} />
                    <StatusPill status={order.payment_status ?? "unpaid"} />
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: order.assignee ? "#A85C8526" : "#A85C850F",
                        color: order.assignee ? "#A85C85" : "#A85C85AA",
                      }}
                    >
                      {order.assignee ?? "Unassigned"}
                    </span>
                  </div>
                </button>

              {isOpen && (
  <div
    className="px-4 pb-5 pt-4 sm:px-5 flex flex-col gap-3"
    style={{ borderTop: `1px solid ${BORDER}` }}
  >
    {/* Contact + delivery */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className={PANEL_CLASS} style={PANEL_STYLE}>
        <p className={LABEL_CLASS} style={{ color: ACCENT }}>
          Contact
        </p>
        <p className="text-sm" style={{ color: "#000000" }}>
          {order.customer_phone || "No phone"}
        </p>
        <p className="text-sm break-all" style={{ color: "#000000" }}>
          {order.customer_email || "No email"}
        </p>
      </div>

      <div className={PANEL_CLASS} style={PANEL_STYLE}>
        <p className={LABEL_CLASS} style={{ color: ACCENT }}>
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

    {/* Items */}
    <div className={PANEL_CLASS} style={PANEL_STYLE}>
      <p className={LABEL_CLASS} style={{ color: ACCENT }}>
        Items
      </p>

      {items.length === 0 && (
        <p className="text-sm" style={{ color: MUTED }}>
          No item details on this order.
        </p>
      )}

      {items.map((item, i) => (
        <div
          key={`${item.id}-${i}`}
          className={i > 0 ? "mt-3 pt-3" : ""}
          style={i > 0 ? { borderTop: `1px dashed rgba(0,0,0,0.15)` } : undefined}
        >
          <div className="flex items-start gap-3">
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
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

                  const noScent = item.productName === "Fan" || item.productName === "Tambourine";
                  const scentLabel = item.scent ? item.scent : noScent ? null : "Unscented";
                  return [item.color, item.option, scentLabel].filter(Boolean).join(" · ");
                })()}
              </p>
              {customizationNote(item) && (
  <p className="text-xs italic" style={{ color: MUTED }}>
    {customizationNote(item)}
  </p>
)}
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

          <div className="mt-3 empty:hidden">
            <CustomerImageDownloads
              images={collectCustomerImages(item)}
              baseName={`${order.order_code ?? "order"}-${item.productName}`}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Totals */}
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} style={PANEL_STYLE}>
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: MUTED }}>Items total</span>
        <span style={{ color: "#000000" }}>
          {((order.total ?? 0) - (order.shipping_fee ?? 0)).toLocaleString()} LE
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span style={{ color: MUTED }}>Shipping</span>
        <span style={{ color: "#000000" }}>{(order.shipping_fee ?? 0).toLocaleString()} LE</span>
      </div>

      <div
        className="flex items-center justify-between text-sm font-bold pt-2 mt-1"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <span style={{ color: "#000000" }}>Total with shipping</span>
        <span style={{ color: ACCENT }}>{(order.total ?? 0).toLocaleString()} LE</span>
      </div>
    </div>

    {/* Manage */}
    <div className={PANEL_CLASS} style={PANEL_STYLE}>
      <p className={LABEL_CLASS} style={{ color: ACCENT }}>
        Manage order
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
          Status
          <select
            value={order.status ?? "pending"}
            disabled={savingId === order.id}
            onChange={(e) => updateOrder(order.id, { status: e.target.value })}
            className="w-full rounded-lg px-2.5 py-2 text-sm outline-none capitalize"
            style={FIELD_STYLE}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
          Payment
          <select
            value={order.payment_status ?? "unpaid"}
            disabled={savingId === order.id}
            onChange={(e) => updateOrder(order.id, { payment_status: e.target.value })}
            className="w-full rounded-lg px-2.5 py-2 text-sm outline-none capitalize"
            style={FIELD_STYLE}
          >
            {PAYMENT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
          Assigned to
          <select
            value={order.assignee ?? ""}
            disabled={savingId === order.id}
            onChange={(e) => updateOrder(order.id, { assignee: e.target.value || null })}
            className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
            style={FIELD_STYLE}
          >
            <option value="">Unassigned</option>
            {ASSIGNEE_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>

    {/* Actions */}
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => printPackingSlip(order)}
        className="rounded-full px-4 py-2 text-xs font-semibold"
        style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
      >
        Print packing slip
      </button>

                {order.status !== "completed" && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Cancel this order?")) {
                  updateOrder(order.id, { status: "cancelled" });
                }
              }}
              disabled={savingId === order.id || order.status === "cancelled"}
              className="w-full rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
              style={{ border: "1px solid rgba(163,72,72,0.4)", color: "#A34848" }}
            >
              Cancel order
            </button>
          )}

      <button
        type="button"
        onClick={() => deleteOrder(order.id)}
        disabled={savingId === order.id}
        className="ml-auto px-2 py-2 text-xs font-semibold underline disabled:opacity-40"
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