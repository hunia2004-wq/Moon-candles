"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";
import StatusPill from "../components/StatusPill";
import {
  collectCustomerImages,
  candleTextNote,
  type CustomerImage,
} from "@/lib/customerImages";
import CustomerImageDownloads from "../components/CustomerImageDownloads";
import { printPackingSlip } from "@/lib/packingSlip";
import { logAdminActivity } from "@/lib/logAdminActivity";
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

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
] as const;

const ASSIGNEE_OPTIONS = ["Jana", "Nour"] as const;

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

type EntryItem = {
  key: string;
  image: string | null;
  productTitle: string;
  subtitle: string;
  note: string | null;
  quantity: number;
  price: number;
  images: CustomerImage[];
};

type CustomizedEntry = {
  key: string;

  // Which Supabase table this came from.
  source: "custom_orders" | "orders";

  // Actual database id.
  id: string;

  code: string | null;
  orderNo: number | null;

  // custom_orders.price already includes shipping; orders.items'
  // prices do not, so shipping is added on top for those. See the
  // itemsTotal/grandTotal calculation below for how each is handled.
  shippingFee: number;

  customerName: string;
  phone: string | null;
  email: string | null;
  governorate: string | null;
  address: string | null;

  status: string;
  paymentStatus: string | null;

  assignee: string | null;

  createdAt: string;
  completedAt: string | null;

   items: EntryItem[];

  // The untouched database row, so printing uses the full order
  rawOrder?: any;
};

function isCustomizedOrderItem(item: any): boolean {
  if (item.category === "giveaway") return true;
  return !!item.customization;
}

function matchesSearch(entry: CustomizedEntry, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();

  if (!q) return true;

  // Exact order number searches:
  // 12
  // #12
  // Moon-12
  // Custom-12
  const numberQuery = q.match(/^(moon|custom)-(\d{1,5})$/);

  if (numberQuery) {
    return entry.orderNo === Number(numberQuery[2]);
  }

  const simpleNumberQuery = q.match(/^#?(\d{1,5})$/);

  if (simpleNumberQuery) {
    return entry.orderNo === Number(simpleNumberQuery[1]);
  }

  const haystack = [
    entry.code,
    entry.customerName,
    entry.phone,
    entry.email,
    entry.id,
    ...entry.items.flatMap((i) => [
      i.productTitle,
      i.subtitle,
      i.note,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default function CustomOrdersPage() {
  const [entries, setEntries] = useState<CustomizedEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [view, setView] = useState<
    "active" | "cancelled" | "completed" | "history"
  >("active");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setStatusFilter("all");
    setExpandedId(null);
  }, [view]);
  async function loadOrders(silent = false) {
    if (!silent) setLoading(true);
    setError(null);

    const supabase = createClient();

    const [candleRes, ordersRes] = await Promise.all([
      supabase
        .from("custom_orders")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (candleRes.error) {
      setError(candleRes.error.message);
      setLoading(false);
      return;
    }

    if (ordersRes.error) {
      setError(ordersRes.error.message);
      setLoading(false);
      return;
    }

    const candleEntries: CustomizedEntry[] = (
      candleRes.data ?? []
    ).map((o: any) => ({
      key: `candle-${o.id}`,
      source: "custom_orders",
      id: o.id,

      code: o.order_code ?? null,
      orderNo: o.order_no ?? null,

      customerName: o.customer_name || "Unnamed customer",
      phone: o.customer_phone ?? null,
      email: o.customer_email ?? null,

      governorate: o.governorate ?? null,
      address: o.address ?? null,

          status: o.status || "pending",
      paymentStatus: o.payment_status ?? null,
      assignee: o.assignee ?? null,

      shippingFee: Number(o.shipping_fee ?? 0),

      createdAt: o.created_at,
      completedAt: o.completed_at ?? null,

      items: [
        {
          key: `candle-${o.id}-item`,
          image: o.photo_url ?? null,

          productTitle: "Custom Candle",

          subtitle: `${o.size_label} · ${
            o.scent || "No scent chosen"
          }`,

          note: o.message
            ? `"${o.message}"`
            : "No message",

          quantity: 1,

          price: Number(o.price ?? 0),

          images:
            typeof o.photo_url === "string" &&
            o.photo_url.startsWith("http")
              ? [
                  {
                    label: "photo",
                    url: o.photo_url,
                  },
                ]
              : [],
        },
      ],
    }));

    const giveawayEntries: CustomizedEntry[] = [];

    for (const order of ordersRes.data ?? []) {
      const orderItems = Array.isArray(order.items)
        ? order.items
        : [];

      const matchingItems = orderItems.filter(
        isCustomizedOrderItem
      );

      if (matchingItems.length === 0) continue;

      const items: EntryItem[] = matchingItems.map(
        (item: any) => {
          const c = item.customization;

          let note: string | null = null;

          if (c?.type === "monogram") {
            note = c.monogramText
              ? `Initials: "${c.monogramText}"`
              : c.monogramImage
              ? "Custom uploaded lettering"
              : null;
          } else if (
            c?.type === "customized-tambourine"
          ) {
            note = c.ribbonColor
              ? `Ribbon: ${c.ribbonColor}`
              : null;
          } else if (
            c?.type === "customized-fan"
          ) {
            note = c.tasselColor
              ? `Tassel: ${c.tasselColor}`
              : null;
          } else if (
            c?.type === "customized-candle"
          ) {
            note = candleTextNote(c);
          } else if (
            item.photoUrlFront ||
            item.photoUrlBack
          ) {
            note = "Includes uploaded photo";
          }

          const colorLower =
            item.color?.trim().toLowerCase();

          let subtitle = "";

          if (colorLower === "unscented") {
            subtitle = "Unscented";
          } else if (colorLower === "scented") {
            subtitle = item.scent
              ? `Scented — ${item.scent}`
              : "Scented";
          } else {
           const noScent = item.productName === "Fan" || item.productName === "Tambourine";
const scentLabel = item.scent ? item.scent : noScent ? null : "Unscented";

            subtitle = [
              item.color,
              item.option,
              scentLabel,
            ]
              .filter(Boolean)
              .join(" · ");
          }

          return {
            key: `${order.id}-${item.id}`,

            image:
              item.image ||
              c?.photoUrl ||
              c?.monogramImage ||
              item.photoUrlFront ||
              null,

            productTitle:
              item.productName ??
              "Customized item",

            subtitle,

            note,

            quantity: Number(
              item.quantity ?? 1
            ),

            price:
              Number(item.price ?? 0) *
              Number(item.quantity ?? 1),

            images: collectCustomerImages(item),
          };
        }
      );

      giveawayEntries.push({
        key: `order-${order.id}`,

        source: "orders",
        id: order.id,

        code: order.order_code ?? null,
        orderNo: order.order_no ?? null,

        customerName:
          order.customer_name ||
          "Unnamed customer",

        phone:
          order.customer_phone ?? null,

        email:
          order.customer_email ?? null,

        governorate:
          order.governorate ?? null,

        address:
          order.address ?? null,

        status:
          order.status || "pending",

        paymentStatus:
          order.payment_status ?? null,

        assignee: order.assignee ?? null,

        shippingFee: Number(order.shipping_fee ?? 0),

        createdAt: order.created_at,

        completedAt:
          order.completed_at ?? null,

             items,
        rawOrder: order,

      });
    }

    const combined = [
      ...candleEntries,
      ...giveawayEntries,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    setEntries(combined);
    setLoading(false);
  }

  async function updateEntry(
    entry: CustomizedEntry,
    patch: {
      status?: string;
      payment_status?: string;
      assignee?: string | null;
    }
  ) {
    setSavingId(entry.key);

    const fullPatch: {
      status?: string;
      payment_status?: string;
      completed_at?: string;
      assignee?: string | null;
    } = {
      ...patch,
    };

    // Same behavior as the normal Orders page.
    if (patch.status === "completed") {
      fullPatch.payment_status = "paid";
      fullPatch.completed_at =
        new Date().toISOString();
    } else if (
      patch.payment_status === "paid"
    ) {
      fullPatch.status = "completed";
      fullPatch.completed_at =
        new Date().toISOString();
    }

    const supabase = createClient();

    const table =
      entry.source === "custom_orders"
        ? "custom_orders"
        : "orders";

    const { error } = await supabase
      .from(table)
      .update(fullPatch)
      .eq("id", entry.id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
      setSavingId(null);
      return;
    }

    // log:custom-update
    {
      const isCustom = entry.source === "custom_orders";
      const base = {
        entityType: isCustom ? "custom_order" : "order",
        entityId: String(entry.id),
        entityLabel: `${isCustom ? "Custom order" : "Order"} #${String(entry.id).slice(0, 8)}`,
      };
      if (fullPatch.status !== undefined && fullPatch.status !== entry.status) {
        logAdminActivity({
          ...base,
          action: "order.status_changed",
          details: { from: entry.status, to: fullPatch.status },
        });
      }
      if (patch.payment_status !== undefined && patch.payment_status !== entry.paymentStatus) {
        logAdminActivity({
          ...base,
          action: "order.payment_changed",
          details: { from: entry.paymentStatus, to: patch.payment_status },
        });
      }
      if (patch.assignee !== undefined && patch.assignee !== entry.assignee) {
        logAdminActivity({
          ...base,
          action: "order.assigned",
          details: { from: entry.assignee ?? null, assigned_to: patch.assignee ?? "" },
        });
      }
    }

    setEntries((prev) =>
      prev.map((item) =>
        item.key === entry.key
          ? {
              ...item,
              status:
                fullPatch.status ??
                item.status,
              paymentStatus:
                fullPatch.payment_status ??
                item.paymentStatus,
              completedAt:
                fullPatch.completed_at ??
                item.completedAt,
              assignee:
                patch.assignee !== undefined ? patch.assignee : item.assignee,
            }
          : item
      )
    );

    setSavingId(null);
  }

  async function deleteEntry(
    entry: CustomizedEntry
  ) {
    if (
      !confirm(
        "Delete this order? This can't be undone."
      )
    ) {
      return;
    }

    setSavingId(entry.key);

    const supabase = createClient();

    const table =
      entry.source === "custom_orders"
        ? "custom_orders"
        : "orders";

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", entry.id);

    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      setSavingId(null);
      return;
    }

    // log:custom-delete
    {
      const isCustom = entry.source === "custom_orders";
      logAdminActivity({
        action: "order.deleted",
        entityType: isCustom ? "custom_order" : "order",
        entityId: String(entry.id),
        entityLabel: `${isCustom ? "Custom order" : "Order"} #${String(entry.id).slice(0, 8)}`,
        details: { snapshot: entry },
      });
    }

    setEntries((prev) =>
      prev.filter(
        (item) => item.key !== entry.key
      )
    );

    setExpandedId(null);
    setSavingId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const oneWeekAgo =
      Date.now() -
      7 * 24 * 60 * 60 * 1000;

    return entries.filter((entry) => {
      const isCancelled =
        entry.status === "cancelled";

      const isCompleted =
        entry.status === "completed";

      const isPaid =
        entry.paymentStatus === "paid";

      const completedRecently =
        isCompleted &&
        entry.completedAt &&
        new Date(entry.completedAt).getTime() >=
          oneWeekAgo;

      if (
        view === "cancelled" &&
        !isCancelled
      ) {
        return false;
      }

      if (
        view === "completed" &&
        !completedRecently
      ) {
        return false;
      }

      if (
        view === "history" &&
        (isCancelled || !isPaid)
      ) {
        return false;
      }

      if (
        view === "active" &&
        (isCancelled ||
          isCompleted ||
          isPaid)
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        entry.status !== statusFilter
      ) {
        return false;
      }

      return matchesSearch(entry, q);
    });
  }, [
    entries,
    search,
    statusFilter,
    view,
  ]);

  return (
    <div
      style={{ backgroundColor: BG }}
      className="min-h-screen"
    >
      <div className="px-4 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">

               {/* HEADER */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
              Custom Orders
            </h1>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              {filtered.length} order{filtered.length !== 1 ? "s" : ""} in this view
            </p>
          </div>

          <div className="flex items-center gap-4">
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

               {/* VIEWS */}
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
          <p
            className="text-xs mb-4"
            style={{ color: MUTED }}
          >
            Completed orders remain here for one
            week after completion. After that,
            they can be found in History.
          </p>
        )}

        {/* SEARCH + FILTER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by order number, name, phone, email, or product"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              border:
                "1.5px solid rgba(0,0,0,0.15)",
              backgroundColor: "#FFFFFF",
              color: "#000000",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl px-4 py-2.5 text-sm outline-none capitalize"
            style={{
              border:
                "1.5px solid rgba(0,0,0,0.15)",
              backgroundColor: "#FFFFFF",
              color: "#000000",
            }}
          >
            <option value="all">
              All statuses
            </option>

            {statusOptionsForView(view).map(
              (status) => (
                <option
                  key={status}
                  value={status}
                  className="capitalize"
                >
                  {status.replace("_", " ")}
                </option>
              )
            )}
          </select>
        </div>

        {/* LOADING */}
        {loading && (
          <p
            className="text-sm"
            style={{ color: MUTED }}
          >
            Loading custom orders...
          </p>
        )}

        {/* ERROR */}
        {error && (
          <p
            className="text-sm rounded-xl px-4 py-3"
            style={{
              backgroundColor: "#F5DADA",
              color: "#A34848",
            }}
          >
            Couldn't load custom orders:{" "}
            {error}
          </p>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div
              className="rounded-2xl px-5 py-8 text-center text-sm"
              style={{
                backgroundColor: CARD_BG,
                color: MUTED,
                border:
                  "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {entries.length === 0
                ? "No custom orders yet."
                : "No custom orders match your search."}
            </div>
          )}

        {/* ORDERS */}
        <div className="flex flex-col gap-3">
          {filtered.map((o) => {
            const isOpen =
              expandedId === o.key;

            const isSaving =
              savingId === o.key;

                     const itemsSum = o.items.reduce(
              (sum, item) =>
                sum + item.price,
              0
            );

            // custom_orders' stored price already includes shipping,
            // so itemsTotal is derived by subtracting it back out.
            // orders' item prices don't include shipping, so it's
            // added on top instead.
            const itemsTotal =
              o.source === "custom_orders"
                ? itemsSum - o.shippingFee
                : itemsSum;

            const grandTotal =
              o.source === "custom_orders"
                ? itemsSum
                : itemsSum + o.shippingFee;

            const itemCount =
              o.items.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              );

            return (
              <div
                key={o.key}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: CARD_BG,
                  border:
                    "1px solid rgba(0,0,0,0.08)",
                }}
              >
                              {/* ORDER HEADER */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : o.key)}
                  className="relative w-full flex flex-col gap-3 pl-6 pr-4 py-4 text-left sm:pr-5"
                >
                  {/* status stripe down the left edge */}
                  <span
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{
                      backgroundColor:
                        o.status === "cancelled"
                          ? "#A34848"
                          : o.status === "completed"
                          ? "#3A6DB0"
                          : o.status === "pending"
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
                        {o.code?.split("-")[0] ?? (o.source === "custom_orders" ? "Custom" : "Moon")}
                      </span>
                      <span className="font-serif text-xl font-bold leading-none" style={{ color: "#000000" }}>
                        {o.orderNo ?? "–"}
                      </span>
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-base font-semibold" style={{ color: "#000000" }}>
                        {o.customerName}
                      </span>
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
                        {new Date(o.createdAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                      <span className="font-serif text-xl font-bold leading-none" style={{ color: ACCENT }}>
                        {grandTotal.toLocaleString()}
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
                    <StatusPill status={o.status} />
                    {o.paymentStatus && <StatusPill status={o.paymentStatus} />}
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: o.assignee ? "#A85C8526" : "#A85C850F",
                        color: o.assignee ? "#A85C85" : "#A85C85AA",
                      }}
                    >
                      {o.assignee ?? "Unassigned"}
                    </span>
                  </div>
                </button>
{/* EXPANDED CONTENT */}
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
          {o.phone || "No phone"}
        </p>
        <p className="text-sm break-all" style={{ color: "#000000" }}>
          {o.email || "No email"}
        </p>
      </div>

      <div className={PANEL_CLASS} style={PANEL_STYLE}>
        <p className={LABEL_CLASS} style={{ color: ACCENT }}>
          Delivery
        </p>
        <p className="text-sm" style={{ color: "#000000" }}>
          {o.governorate || "No governorate"}
        </p>
        <p className="text-sm" style={{ color: "#000000" }}>
          {o.address || "No address"}
        </p>
      </div>
    </div>

    {/* Items */}
    <div className={PANEL_CLASS} style={PANEL_STYLE}>
      <p className={LABEL_CLASS} style={{ color: ACCENT }}>
        Items
      </p>

      {o.items.map((it, i) => (
        <div
          key={it.key}
          className={i > 0 ? "mt-3 pt-3" : ""}
          style={i > 0 ? { borderTop: "1px dashed rgba(0,0,0,0.15)" } : undefined}
        >
          <div className="flex items-start gap-3">
            {it.image && (
              <img
                src={it.image}
                alt=""
                className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                {it.productTitle}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                {it.subtitle}
              </p>
              {it.note && (
                <p className="text-xs italic" style={{ color: MUTED }}>
                  {it.note}
                </p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                x{it.quantity}
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                {it.price.toLocaleString()} LE
              </p>
            </div>
          </div>

          <div className="mt-3 empty:hidden">
            <CustomerImageDownloads
              images={it.images}
              baseName={`${o.code ?? "order"}-${it.productTitle}`}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Totals */}
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} style={PANEL_STYLE}>
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: MUTED }}>Items total</span>
        <span style={{ color: "#000000" }}>{itemsTotal.toLocaleString()} LE</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span style={{ color: MUTED }}>Shipping</span>
        <span style={{ color: "#000000" }}>{o.shippingFee.toLocaleString()} LE</span>
      </div>

      <div
        className="flex items-center justify-between text-sm font-bold pt-2 mt-1"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <span style={{ color: "#000000" }}>Total with shipping</span>
        <span style={{ color: ACCENT }}>{grandTotal.toLocaleString()} LE</span>
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
            value={o.status ?? "pending"}
            disabled={isSaving}
            onChange={(e) => updateEntry(o, { status: e.target.value })}
            className="w-full rounded-lg px-2.5 py-2 text-sm outline-none capitalize"
            style={FIELD_STYLE}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        {o.paymentStatus && (
          <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
            Payment
            <select
              value={o.paymentStatus}
              disabled={isSaving}
              onChange={(e) => updateEntry(o, { payment_status: e.target.value })}
              className="w-full rounded-lg px-2.5 py-2 text-sm outline-none capitalize"
              style={FIELD_STYLE}
            >
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
            </select>
          </label>
        )}
      

        <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
          Assigned to
          <select
            value={o.assignee ?? ""}
            disabled={isSaving}
            onChange={(e) => updateEntry(o, { assignee: e.target.value || null })}
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
        onClick={() => {
          // Regular orders: print the whole order, not just
          // the giveaway items shown on this page
          if (o.rawOrder) {
            printPackingSlip(o.rawOrder);
            return;
          }

          printPackingSlip({
            order_code: o.code,
            created_at: o.createdAt,
            customer_name: o.customerName,
            customer_phone: o.phone,
            governorate: o.governorate,
            address: o.address,
            payment_status: o.paymentStatus,
            shipping_fee: o.shippingFee,
            total: grandTotal,
            items: o.items.map((it) => ({
              productName: it.productTitle,
              detail: [it.subtitle, it.note].filter(Boolean).join(" · "),
              quantity: it.quantity,
              amount: it.price - o.shippingFee,
            })),
          });
        }}
        className="rounded-full px-4 py-2 text-xs font-semibold"
        style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
      >
        Print packing slip
      </button>

           {o.status !== "completed" && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Cancel this order?")) {
              updateEntry(o, { status: "cancelled" });
            }
          }}
          disabled={isSaving || o.status === "cancelled"}
          className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40"
          style={{ border: "1px solid rgba(163,72,72,0.4)", color: "#A34848" }}
        >
          Cancel order
        </button>
      )}

      <button
        type="button"
        onClick={() => deleteEntry(o)}
        disabled={isSaving}
        className="ml-auto px-2 py-2 text-xs font-semibold underline disabled:opacity-40"
        style={{ color: "#A34848" }}
      >
        {isSaving ? "Saving..." : "Delete order"}
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