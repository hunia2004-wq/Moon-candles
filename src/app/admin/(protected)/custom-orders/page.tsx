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

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
] as const;

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

  createdAt: string;
  completedAt: string | null;

  items: EntryItem[];
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

  async function loadOrders() {
    setLoading(true);
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

        shippingFee: Number(order.shipping_fee ?? 0),

        createdAt: order.created_at,

        completedAt:
          order.completed_at ?? null,

        items,
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
    }
  ) {
    setSavingId(entry.key);

    const fullPatch: {
      status?: string;
      payment_status?: string;
      completed_at?: string;
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
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-serif font-bold"
              style={{ color: "#000000" }}
            >
              Custom Orders
            </h1>

            <p
              className="text-sm mt-1"
              style={{ color: MUTED }}
            >
              Candle customizations and customized
              giveaway orders.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="text-xs font-semibold underline"
            style={{ color: ACCENT }}
          >
            Refresh
          </button>
        </div>

        {/* VIEWS */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => setView("active")}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor:
                view === "active"
                  ? "#3F8F5C"
                  : "transparent",
              color:
                view === "active"
                  ? "#FFFFFF"
                  : "#3F8F5C",
              border:
                "1.5px solid #3F8F5C",
            }}
          >
            Active
          </button>

          <button
            type="button"
            onClick={() =>
              setView("cancelled")
            }
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor:
                view === "cancelled"
                  ? "#A34848"
                  : "transparent",
              color:
                view === "cancelled"
                  ? "#FFFFFF"
                  : "#A34848",
              border:
                "1.5px solid #A34848",
            }}
          >
            Cancelled
          </button>

          <button
            type="button"
            onClick={() =>
              setView("completed")
            }
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor:
                view === "completed"
                  ? "#3A6DB0"
                  : "transparent",
              color:
                view === "completed"
                  ? "#FFFFFF"
                  : "#3A6DB0",
              border:
                "1.5px solid #3A6DB0",
            }}
          >
            Completed
          </button>

          <button
            type="button"
            onClick={() =>
              setView("history")
            }
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor:
                view === "history"
                  ? ACCENT
                  : "transparent",
              color:
                view === "history"
                  ? "#FFFFFF"
                  : ACCENT,
              border:
                `1.5px solid ${ACCENT}`,
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
                  onClick={() =>
                    setExpandedId(
                      isOpen ? null : o.key
                    )
                  }
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex flex-col gap-0.5 min-w-[160px]">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#000000" }}
                    >
                      {o.customerName}

                      {o.code && (
                        <span
                          className="ml-2 text-xs font-normal"
                          style={{
                            color: MUTED,
                          }}
                        >
                          {o.code}
                        </span>
                      )}
                    </span>

                    <span
                      className="text-xs"
                      style={{
                        color: MUTED,
                      }}
                    >
                      {Array.from(
                        new Set(
                          o.items.map(
                            (item) =>
                              item.productTitle
                          )
                        )
                      ).join(" + ")}{" "}
                      · {itemCount} item
                      {itemCount !== 1
                        ? "s"
                        : ""}
                    </span>

                    <span
                      className="text-xs"
                      style={{
                        color: MUTED,
                      }}
                    >
                      {new Date(
                        o.createdAt
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill
                      status={o.status}
                    />

                    {o.paymentStatus && (
                      <StatusPill
                        status={
                          o.paymentStatus
                        }
                      />
                    )}

                                      <span
                      className="text-sm font-bold ml-2"
                      style={{
                        color: ACCENT,
                      }}
                    >
                      {grandTotal.toLocaleString()} LE
                    </span>

                    <span
                      className="text-xs ml-1 transition-transform"
                      style={{
                        color: MUTED,
                        transform: isOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {/* EXPANDED CONTENT */}
                {isOpen && (
                  <div
                    className="px-5 pb-5 pt-1 flex flex-col gap-5"
                    style={{
                      borderTop:
                        "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* CONTACT + DELIVERY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.15em] mb-1"
                          style={{
                            color: ACCENT,
                          }}
                        >
                          Contact
                        </p>

                        <p
                          className="text-sm"
                          style={{
                            color: "#000000",
                          }}
                        >
                          {o.phone ||
                            "No phone"}
                        </p>

                        <p
                          className="text-sm"
                          style={{
                            color: "#000000",
                          }}
                        >
                          {o.email ||
                            "No email"}
                        </p>
                      </div>

                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.15em] mb-1"
                          style={{
                            color: ACCENT,
                          }}
                        >
                          Delivery
                        </p>

                        <p
                          className="text-sm"
                          style={{
                            color: "#000000",
                          }}
                        >
                          {o.governorate ||
                            "No governorate"}
                        </p>

                        <p
                          className="text-sm"
                          style={{
                            color: "#000000",
                          }}
                        >
                          {o.address ||
                            "No address"}
                        </p>
                      </div>
                    </div>

                    {/* ITEMS */}
                    <div>
                      <p
                        className="text-[11px] uppercase tracking-[0.15em] mb-2"
                        style={{
                          color: ACCENT,
                        }}
                      >
                        Items
                      </p>

                      <div className="flex flex-col gap-2">
                        {o.items.map((it) => (
                          <div
                            key={it.key}
                            className="rounded-xl p-3 flex flex-col gap-3"
                            style={{
                              backgroundColor:
                                "#FFFFFF",
                              border:
                                "1px solid rgba(0,0,0,0.06)",
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                />
                              )}

                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium"
                                  style={{
                                    color:
                                      "#000000",
                                  }}
                                >
                                  {
                                    it.productTitle
                                  }
                                </p>

                                <p
                                  className="text-xs"
                                  style={{
                                    color: MUTED,
                                  }}
                                >
                                  {
                                    it.subtitle
                                  }{" "}
                                  · x
                                  {
                                    it.quantity
                                  }
                                </p>

                                {it.note && (
                                  <p
                                    className="text-xs italic"
                                    style={{
                                      color:
                                        MUTED,
                                    }}
                                  >
                                    {it.note}
                                  </p>
                                )}

                                <CustomerImageDownloads
                                  images={
                                    it.images
                                  }
                                  baseName={`${o.code ?? "order"}-${it.productTitle}`}
                                />
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p
                                  className="text-sm font-semibold"
                                  style={{
                                    color:
                                      "#000000",
                                  }}
                                >
                                  {it.price.toLocaleString()}{" "}
                                  LE
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                                 </div>

                    {/* TOTAL BREAKDOWN */}
                    <div
                      className="flex flex-col gap-1 rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: MUTED }}>Items total</span>
                        <span style={{ color: "#000000" }}>
                          {itemsTotal.toLocaleString()} LE
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: MUTED }}>Shipping</span>
                        <span style={{ color: "#000000" }}>
                          {o.shippingFee.toLocaleString()} LE
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between text-sm font-bold pt-1"
                        style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
                      >
                        <span style={{ color: "#000000" }}>Total with shipping</span>
                        <span style={{ color: ACCENT }}>
                          {grandTotal.toLocaleString()} LE
                        </span>
                      </div>
                    </div>

                    {/* STATUS / PAYMENT / ACTIONS */}
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label
                        className="flex items-center gap-2 text-xs"
                        style={{
                          color: MUTED,
                        }}
                      >
                        Status

                        <select
                          value={
                            o.status ??
                            "pending"
                          }
                          disabled={isSaving}
                          onChange={(e) =>
                            updateEntry(
                              o,
                              {
                                status:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          className="rounded-lg px-2.5 py-1.5 text-sm outline-none capitalize"
                          style={{
                            border:
                              "1.5px solid rgba(0,0,0,0.15)",
                            backgroundColor:
                              "#FFFFFF",
                            color: "#000000",
                          }}
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status.replace(
                                  "_",
                                  " "
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      {o.paymentStatus && (
                        <label
                          className="flex items-center gap-2 text-xs"
                          style={{
                            color: MUTED,
                          }}
                        >
                          Payment

                          <select
                            value={
                              o.paymentStatus
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(e) =>
                              updateEntry(
                                o,
                                {
                                  payment_status:
                                    e.target
                                      .value,
                                }
                              )
                            }
                            className="rounded-lg px-2.5 py-1.5 text-sm outline-none"
                            style={{
                              border:
                                "1.5px solid rgba(0,0,0,0.15)",
                              backgroundColor:
                                "#FFFFFF",
                              color:
                                "#000000",
                            }}
                          >
                            <option value="unpaid">
                              unpaid
                            </option>
                            <option value="paid">
                              paid
                            </option>
                          </select>
                        </label>
                      )}

                      {/* CANCEL */}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Cancel this order?"
                            )
                          ) {
                            updateEntry(
                              o,
                              {
                                status:
                                  "cancelled",
                              }
                            );
                          }
                        }}
                        disabled={
                          isSaving ||
                          o.status ===
                            "cancelled"
                        }
                        className="text-xs font-semibold underline disabled:opacity-40"
                        style={{
                          color: "#A34848",
                        }}
                      >
                        Cancel order
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() =>
                          deleteEntry(o)
                        }
                        disabled={isSaving}
                        className="text-xs font-semibold underline ml-auto disabled:opacity-40"
                        style={{
                          color: "#A34848",
                        }}
                      >
                        {isSaving
                          ? "Saving..."
                          : "Delete order"}
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