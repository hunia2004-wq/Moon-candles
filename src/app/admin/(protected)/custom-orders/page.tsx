import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatusPill from "../components/StatusPill";

type CustomizedEntry = {
  key: string;
  kind: "candle" | "item";
  href: string;
  customerName: string;
  image: string | null;
  productTitle: string;
  subtitle: string;
  note: string | null;
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

export default async function CustomOrdersPage() {
  const supabase = await createClient();

  const [candleRes, ordersRes] = await Promise.all([
    supabase.from("custom_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
  ]);

  const candleEntries: CustomizedEntry[] = (candleRes.data ?? []).map((o) => ({
    key: `candle-${o.id}`,
    kind: "candle",
    href: `/admin/custom-orders/${o.id}`,
    customerName: o.customer_name || "Unnamed customer",
    image: o.photo_url ?? null,
    productTitle: "Custom Candle",
    subtitle: `${o.size_label} · ${o.scent || "No scent chosen"}`,
    note: o.message ? `"${o.message}"` : "No message",
    status: o.status,
    price: Number(o.price ?? 0),
    createdAt: o.created_at,
  }));

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
        kind: "item",
        href: "/admin/orders",
        customerName: order.customer_name || "Unnamed customer",
        image: item.image || c?.photoUrl || c?.monogramImage || item.photoUrlFront || null,
        productTitle: item.productName ?? "Customized item",
        subtitle,
        note,
        status: order.status,
        price: Number(item.price ?? 0) * Number(item.quantity ?? 1),
        createdAt: order.created_at,
      });
    }
  }

  const allEntries = [...candleEntries, ...giveawayEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: "#000000" }}>
        Custom Orders
      </h1>
      <p className="text-sm mb-8" style={{ color: "rgba(0,0,0,0.55)" }}>
        Candle customizations and every giveaway order — any new giveaway you add in Products shows up here
        automatically.
      </p>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}>
        {allEntries.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
            No custom orders yet.
          </p>
        )}
        {allEntries.map((o) => (
          <Link
            key={o.key}
            href={o.href}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FFF9F0]"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div
              className="h-14 w-14 shrink-0 rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#F3EBD9" }}
            >
              {o.image && <img src={o.image} alt="" className="h-full w-full object-cover" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "#000000" }}>
                {o.productTitle}
              </p>
              <p className="text-xs truncate" style={{ color: "rgba(0,0,0,0.6)" }}>
                Ordered by {o.customerName}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>
                {o.subtitle}
              </p>
              {o.note && (
                <p className="text-xs italic truncate mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                  {o.note}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusPill status={o.status} />
              <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                {o.price.toLocaleString()} LE
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}