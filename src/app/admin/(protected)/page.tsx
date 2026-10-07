import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Caveat } from "next/font/google";
import BestSellerCard from "./components/BestSellerCard";
import { getActingName } from "@/lib/adminStaff";
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const actingName = await getActingName();

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
                   {actingName ? `Hi ${actingName}` : "Hi there"}
        </h1>
      </div>

      <div
        className="relative mb-3 overflow-hidden rounded-3xl px-6 py-6 md:mb-4"
        style={{ backgroundColor: "#DE4B33" }}
      >
        <span
          className="pointer-events-none absolute -right-4 -top-10 select-none font-serif text-[170px] leading-none"
          style={{ color: "#FFF4E6", opacity: 0.18 }}
        >
          ☾
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#FFF4E6" }}>
          Revenue
        </p>
        <p className="mt-2 font-serif text-4xl font-bold leading-none md:text-5xl" style={{ color: "#FFFFFF" }}>
          {revenue.toLocaleString()} <span className="text-xl font-semibold">LE</span>
        </p>
        <p className="mt-2 text-xs" style={{ color: "#FFF4E6", opacity: 0.85 }}>
          Cancelled orders not counted
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10 md:gap-4">
        <StatCard
          label="Total"
          value={allOrders.length.toString()}
          color="#3F8F5C"
          percent={100}
          caption="all orders"
        />
        <StatCard
          label="Pending"
          value={pendingCount.toString()}
          color="#D08A1E"
          percent={Math.round((pendingCount / (allOrders.length || 1)) * 100)}
          caption={`${Math.round((pendingCount / (allOrders.length || 1)) * 100)}% of orders`}
        />
        <StatCard
          label="Completed"
          value={completedCount.toString()}
          color="#3A6DB0"
          percent={Math.round((completedCount / (allOrders.length || 1)) * 100)}
          caption={`${Math.round((completedCount / (allOrders.length || 1)) * 100)}% of orders`}
        />
      </div>

            <div className="mb-10">
        <BestSellerCard />
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

function StatCard({
  label,
  value,
  color,
  percent,
  caption,
}: {
  label: string;
  value: string;
  color: string;
  percent: number;
  caption: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFF9F0" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "rgba(0,0,0,0.55)" }}
      >
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl font-bold leading-none" style={{ color }}>
        {value}
      </p>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${color}26` }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1.5 text-[10px]" style={{ color: "rgba(0,0,0,0.5)" }}>
        {caption}
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

function StatusPill({ status }: { status: string }) {
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