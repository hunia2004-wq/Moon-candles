import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import StatusUpdater from "./StatusUpdater";

export default async function CustomOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("custom_orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: "#000000" }}>
        Custom order
      </h1>
      <p className="text-xs mb-8" style={{ color: "rgba(0,0,0,0.5)" }}>
        Submitted {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl p-5" style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFF9F0" }}>
          <h2 className="text-xs uppercase tracking-wide mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>
            Candle
          </h2>
          <Row label="Size" value={order.size_label} />
          <Row label="Scent" value={order.scent || "—"} />
          <Row label="Price" value={`${Number(order.price).toLocaleString()} LE`} />
        </div>

        <div className="rounded-2xl p-5" style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFF9F0" }}>
          <h2 className="text-xs uppercase tracking-wide mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>
            Customer
          </h2>
          <Row label="Name" value={order.customer_name || "—"} />
          <Row label="Phone" value={order.customer_phone || "—"} />
          <Row label="Email" value={order.customer_email || "—"} />
          <Row label="Governorate" value={order.governorate || "—"} />
          <Row label="Address" value={order.address || "—"} />
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-8" style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFF9F0" }}>
        <h2 className="text-xs uppercase tracking-wide mb-3" style={{ color: "rgba(0,0,0,0.55)" }}>
          Label
        </h2>
        <p className="text-sm italic mb-4" style={{ color: "#000000" }}>
          "{order.message || "No message"}"
        </p>
        {order.photo_url ? (
          <a href={order.photo_url} target="_blank" rel="noreferrer">
            <img
              src={order.photo_url}
              alt="Customer photo"
              className="w-48 rounded-xl"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }}
            />
          </a>
        ) : (
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            No photo uploaded.
          </p>
        )}
      </div>

      <StatusUpdater orderId={order.id} currentStatus={order.status} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span style={{ color: "rgba(0,0,0,0.55)" }}>{label}</span>
      <span className="font-medium text-right" style={{ color: "#000000" }}>
        {value}
      </span>
    </div>
  );
}