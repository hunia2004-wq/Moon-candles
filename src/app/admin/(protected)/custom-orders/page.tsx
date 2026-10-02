import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatusPill from "../components/StatusPill";
import { collectCustomerImages, type CustomerImage } from "@/lib/customerImages";
import CustomerImageDownloads from "../components/CustomerImageDownloads";

const ACCENT = "#DE4B33";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

type CustomizedEntry = {
  key: string;
  code: string | null;
  orderNo: number | null;
  customerName: string;
  phone: string | null;
  email: string | null;
  governorate: string | null;
  address: string | null;
  image: string | null;
  productTitle: string;
  subtitle: string;
  note: string | null;
  quantity: number;
  images: CustomerImage[];
  status: string;
  price: number;
  createdAt: string;
};

// Any item whose category was stamped "giveaway" at add-to-cart time
// counts automatically — no hardcoded name list to maintain, so a
// new giveaway added in the admin Products panel shows up here the
// moment a customer orders it, with zero code changes. Anything else
// (a regular candle, say) only counts if it actually carries a
// customization object (message, photo, monogram).
function isCustomizedOrderItem(item: any): boolean {
  if (item.category === "giveaway") return true;
  return !!item.customization;
}

// Search rules:
//  - "moon-5" or "custom-3"  -> exactly that order code
//  - "5" or "#5" (1-5 digits) -> any order with that number
//  - anything else            -> text match on code, name, product and details
function matchesSearch(entry: CustomizedEntry, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const codeQuery = q.match(/^(moon|custom)-(\d{1,5})$/);
  if (codeQuery) {
    return (entry.code ?? "").toLowerCase() === q;
  }

  const numberQuery = q.match(/^#?(\d{1,5})$/);
  if (numberQuery) {
    return entry.orderNo === Number(numberQuery[1]);
  }

  const haystack = [entry.code, entry.customerName, entry.productTitle, entry.subtitle, entry.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default async function CustomOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const supabase = await createClient();

  const [candleRes, ordersRes] = await Promise.all([
    supabase.from("custom_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
  ]);

  const candleEntries: CustomizedEntry[] = (candleRes.data ?? []).map((o) => {
    const images: CustomerImage[] =
      typeof o.photo_url === "string" && o.photo_url.startsWith("http")
        ? [{ label: "photo", url: o.photo_url }]
        : [];

    return {
      key: `candle-${o.id}`,
      code: o.order_code ?? null,
      orderNo: o.order_no ?? null,
      customerName: o.customer_name || "Unnamed customer",
      phone: o.customer_phone ?? null,
      email: o.customer_email ?? null,
      governorate: o.governorate ?? null,
      address: o.address ?? null,
      image: o.photo_url ?? null,
      productTitle: "Custom Candle",
      subtitle: `${o.size_label} · ${o.scent || "No scent chosen"}`,
      note: o.message ? `"${o.message}"` : "No message",
      quantity: 1,
      images,
      status: o.status,
      price: Number(o.price ?? 0),
      createdAt: o.created_at,
    };
  });

  const giveawayEntries: CustomizedEntry[] = [];

  for (const order of ordersRes.data ?? []) {
    const items = Array.isArray(order.items) ? order.items : [];
    const matchingItems = items.filter(isCustomizedOrderItem);

    for (const item of matchingItems) {
      const c = item.customization;
      let note: string | null = null;

      if (c?.type === "monogram") {
        note = c.monogramText
          ? `Initials: "${c.monogramText}"`
          : c.monogramImage
          ? "Custom uploaded lettering"
          : null;
      } else if (c?.type === "customized-tambourine") {
        note = c.ribbonColor ? `Ribbon: ${c.ribbonColor}` : null;
      } else if (c?.type === "customized-fan") {
        note = c.tasselColor ? `Tassel: ${c.tasselColor}` : null;
      } else if (c?.type === "customized-candle") {
        note = c.message ? `"${c.message}"` : "No message";
      } else if (item.photoUrlFront || item.photoUrlBack) {
        // Bloom Wand and similar: no `customization` object, but
        // front/back photo fields live directly on the cart item.
        note = "Includes uploaded photo";
      }

      const scentLabel = item.scent ? item.scent : "Unscented";
      const subtitle = [item.color, item.option, scentLabel].filter(Boolean).join(" · ");

      giveawayEntries.push({
        key: `order-${order.id}-${item.id}`,
        code: order.order_code ?? null,
        orderNo: order.order_no ?? null,
        customerName: order.customer_name || "Unnamed customer",
        phone: order.customer_phone ?? null,
        email: order.customer_email ?? null,
        governorate: order.governorate ?? null,
        address: order.address ?? null,
        image: item.image || c?.photoUrl || c?.monogramImage || item.photoUrlFront || null,
        productTitle: item.productName ?? "Customized item",
        subtitle,
        note,
        quantity: Number(item.quantity ?? 1),
        images: collectCustomerImages(item),
        status: order.status,
        price: Number(item.price ?? 0) * Number(item.quantity ?? 1),
        createdAt: order.created_at,
      });
    }
  }

  const allEntries = [...candleEntries, ...giveawayEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((entry) => matchesSearch(entry, q));

  const hasSearch = q.trim().length > 0;

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: "#000000" }}>
        Custom Orders
      </h1>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        Candle customizations and every giveaway order — any new giveaway you add in Products shows up here
        automatically.
      </p>

      <form action="/admin/custom-orders" method="get" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by order number (e.g. Moon-12 or Custom-3), name, or product"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full px-5 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
          >
            Search
          </button>
          {hasSearch && (
            <Link href="/admin/custom-orders" className="text-xs font-semibold underline" style={{ color: ACCENT }}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {allEntries.length === 0 && (
        <div
          className="rounded-2xl px-5 py-8 text-center text-sm"
          style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
        >
          {hasSearch ? "No custom orders match your search." : "No custom orders yet."}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {allEntries.map((o) => (
          <details
            key={o.key}
            className="group rounded-2xl overflow-hidden"
            style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* Collapsed row — click to expand, same idea as the Orders page */}
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <div
                className="h-14 w-14 shrink-0 rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#F3EBD9" }}
              >
                {o.image && <img src={o.image} alt="" className="h-full w-full object-cover" />}
              </div>

              <div className="flex-1 min-w-[160px]">
                <p className="font-semibold text-sm truncate" style={{ color: "#000000" }}>
                  {o.productTitle}
                  {o.code && (
                    <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>
                      {o.code}
                    </span>
                  )}
                </p>
                <p className="text-xs truncate" style={{ color: "rgba(0,0,0,0.6)" }}>
                  Ordered by {o.customerName}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: MUTED }}>
                  {new Date(o.createdAt).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={o.status} />
                <span className="text-sm font-bold ml-2" style={{ color: ACCENT }}>
                  {o.price.toLocaleString()} LE
                </span>
                <span className="text-xs ml-1 transition-transform group-open:rotate-180" style={{ color: MUTED }}>
                  ▾
                </span>
              </div>
            </summary>

            {/* Expanded details */}
            <div className="px-5 pb-5 pt-1 flex flex-col gap-5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: ACCENT }}>
                    Contact
                  </p>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {o.phone || "No phone"}
                  </p>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {o.email || "No email"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: ACCENT }}>
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

              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: ACCENT }}>
                  Details
                </p>
                <p className="text-sm" style={{ color: "#000000" }}>
                  {o.subtitle} · x{o.quantity}
                </p>
                {o.note && (
                  <p className="text-sm italic" style={{ color: MUTED }}>
                    {o.note}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] mb-2" style={{ color: ACCENT }}>
                  Customer images
                </p>
                {o.images.length === 0 ? (
                  <p className="text-sm" style={{ color: MUTED }}>
                    No uploaded images on this order.
                  </p>
                ) : (
                 <CustomerImageDownloads
  images={o.images}
  baseName={`${o.code ?? "order"}-${o.productTitle}`}
/>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}