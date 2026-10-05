import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [ordersRes, customOrdersRes] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at, customer_name"),
    supabase
      .from("custom_orders")
      .select("id, price, status, created_at, customer_name, size_label"),
  ]);

  const orders = ordersRes.data ?? [];
  const customOrders = customOrdersRes.data ?? [];

  const allOrders = [
    ...orders.map((o) => ({
      id: o.id,
      kind: "Order" as const,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
      customer_name: o.customer_name,
      detail: null as string | null,
    })),
    ...customOrders.map((o) => ({
      id: o.id,
      kind: "Custom" as const,
      total: o.price,
      status: o.status,
      created_at: o.created_at,
      customer_name: o.customer_name,
      detail: o.size_label,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const revenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const completedCount = allOrders.filter((o) => o.status === "completed").length;

  return (
    <div>
               <div className="mb-8">
        <p
          className={`${caveat.className} text-2xl leading-none`}
          style={{ color: "#DE4B33" }}
        >
          welcome back
        </p>

        <h1
          className="mt-1 text-4xl font-medium leading-tight md:text-5xl"
          style={{
            color: "#000000",
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.03em",
          }}
        >
          Hi Nour &amp; Jana
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total orders" value={allOrders.length.toString()} />
        <StatCard label="Pending" value={pendingCount.toString()} />
        <StatCard label="Completed" value={completedCount.toString()} />
        <StatCard label="Revenue" value={`${revenue.toLocaleString()} LE`} />
      </div>

      <h2 className="font-serif text-xl font-bold mb-4" style={{ color: "#000000" }}>
        Recent orders
      </h2>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.1)" }}>
        {allOrders.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
            No orders yet.
          </p>
        )}
        {allOrders.slice(0, 10).map((o) => (
          <Link
            key={`${o.kind}-${o.id}`}
href={o.kind === "Custom" ? `/admin/custom-orders/${o.id}` : "/admin/orders"}
            className="flex items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-[#FFF9F0]"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <span className="font-semibold" style={{ color: "#000000" }}>
                {o.customer_name || "Unnamed customer"}
              </span>
              <span className="ml-2 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                {o.kind === "Custom" ? `Custom · ${o.detail}` : "Order"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={o.status} />
              <span className="font-semibold" style={{ color: "#000000" }}>
                {Number(o.total).toLocaleString()} LE
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFF9F0" }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>
        {label}
      </p>
      <p className="font-serif text-2xl font-bold" style={{ color: "#000000" }}>
        {value}
      </p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#DE4B33",
  confirmed: "#B08900",
  in_production: "#B08900",
  shipped: "#3A6DB0",
  completed: "#3A8F4B",
  cancelled: "#888888",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{
        backgroundColor: `${STATUS_COLORS[status] ?? "#888888"}1A`,
        color: STATUS_COLORS[status] ?? "#888888",
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}