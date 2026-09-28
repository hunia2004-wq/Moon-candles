import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatusPill from "../components/StatusPill";

export default async function CustomOrdersPage() {
  const supabase = await createClient();
  const { data: customOrders } = await supabase
    .from("custom_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = customOrders ?? [];

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: "#000000" }}>
        Custom Orders
      </h1>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}>
        {orders.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
            No custom orders yet.
          </p>
        )}
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/custom-orders/${o.id}`}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FFF9F0]"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div
              className="h-14 w-14 shrink-0 rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "#F3EBD9" }}
            >
              {o.photo_url && (
                <img src={o.photo_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "#000000" }}>
                {o.customer_name || "Unnamed customer"}
              </p>
              <p className="text-xs truncate" style={{ color: "rgba(0,0,0,0.55)" }}>
                {o.size_label} · {o.scent || "No scent chosen"}
              </p>
              <p className="text-xs italic truncate mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                "{o.message || "No message"}"
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusPill status={o.status} />
              <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                {Number(o.price).toLocaleString()} LE
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}