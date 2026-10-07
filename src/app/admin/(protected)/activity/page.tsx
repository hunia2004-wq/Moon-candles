import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/getAdmin";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

const TZ = "Africa/Cairo";

type Row = {
  id: string;
  created_at: string;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  details: Record<string, any> | null;
};

const ACTIONS: Record<string, { icon: string; tint: string; verb: string }> = {
  "order.status_changed": { icon: "📦", tint: "bg-sky-100", verb: "updated the status of" },
  "product.price_changed": { icon: "🏷️", tint: "bg-amber-100", verb: "changed the price of" },
  "order.deleted": { icon: "🗑️", tint: "bg-rose-100", verb: "deleted" },
  "order.assigned": { icon: "👤", tint: "bg-violet-100", verb: "assigned" },
  "scent.created": { icon: "🧴", tint: "bg-emerald-100", verb: "created the scent" },
  "scent.added_to_products": { icon: "➕", tint: "bg-emerald-100", verb: "added the scent" },
  "scent.removed_from_products": { icon: "➖", tint: "bg-amber-100", verb: "removed the scent" },
  "scent.renamed": { icon: "✏️", tint: "bg-sky-100", verb: "renamed the scent" },
  "scent.deleted": { icon: "🗑️", tint: "bg-rose-100", verb: "deleted the scent" },
  "scent.restored": { icon: "♻️", tint: "bg-emerald-100", verb: "restored the scent" },
  "product.restored": { icon: "♻️", tint: "bg-emerald-100", verb: "restored" },
  "order.restored": { icon: "♻️", tint: "bg-emerald-100", verb: "restored" },
  "product.deleted_forever": { icon: "❌", tint: "bg-rose-100", verb: "permanently deleted" },
  "order.deleted_forever": { icon: "❌", tint: "bg-rose-100", verb: "permanently deleted" },
  "scent.deleted_forever": { icon: "❌", tint: "bg-rose-100", verb: "permanently deleted the scent" },
  "order.payment_changed": { icon: "💳", tint: "bg-emerald-100", verb: "updated the payment of" },
};
const FALLBACK = { icon: "✏️", tint: "bg-stone-100", verb: "updated" };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  completed: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-teal-100 text-teal-800",
  in_production: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-amber-100 text-amber-800",
};

function Chip({ children, className = "bg-stone-100 text-stone-700" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function StatusChip({ value }: { value?: string }) {
  if (!value) return null;
  return <Chip className={STATUS_STYLES[value.toLowerCase()] ?? "bg-stone-100 text-stone-700"}>{value.replace(/_/g, " ")}</Chip>;
}

function Details({ row }: { row: Row }) {
  const d = row.details ?? {};
  switch (row.action) {
    case "order.status_changed":
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusChip value={d.from} />
          <span className="text-stone-400">→</span>
          <StatusChip value={d.to} />
        </div>
      );
    case "scent.created":
    case "scent.added_to_products":
    case "scent.removed_from_products": {
      const list = (d.products ?? []) as string[];
      const removed = row.action === "scent.removed_from_products";
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500">{removed ? "removed from" : "added to"}</span>
          {list.length === 0 && <Chip>list only</Chip>}
          {list.slice(0, 6).map((n) => (
            <Chip key={n} className={removed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}>
              {n}
            </Chip>
          ))}
          {list.length > 6 && <Chip>+{list.length - 6} more</Chip>}
        </div>
      );
    }
    case "scent.renamed":
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip className="bg-stone-100 text-stone-500 line-through">{d.from}</Chip>
          <span className="text-stone-400">→</span>
          <Chip className="bg-emerald-100 text-emerald-800">{d.to}</Chip>
        </div>
      );
    case "scent.deleted": {
      const list = (d.products ?? []) as string[];
      if (list.length === 0) return null;
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500">was on</span>
          {list.slice(0, 6).map((n) => (
            <Chip key={n}>{n}</Chip>
          ))}
          {list.length > 6 && <Chip>+{list.length - 6} more</Chip>}
        </div>
      );
    }
    case "product.created":
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {d.price != null && <Chip className="bg-emerald-100 text-emerald-800">{d.price} LE</Chip>}
          {d.category && <Chip className="bg-stone-100 text-stone-700 capitalize">{d.category}</Chip>}
        </div>
      );
    case "promotion.created":
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {d.code && <Chip className="bg-amber-100 text-amber-800">{d.code}</Chip>}
          {d.discount_value != null && (
            <Chip className="bg-emerald-100 text-emerald-800">
              {d.discount_value} {d.discount_type ?? ""}
            </Chip>
          )}
        </div>
      );
    case "review.created":
      return (
        <div className="mt-2 space-y-1.5">
          <Chip className="bg-amber-100 text-amber-800">{"★".repeat(Number(d.rating) || 0)} {d.rating}/5</Chip>
          {d.body && <p className="text-xs italic text-stone-500">“{fmt("body", d.body)}”</p>}
        </div>
      );
    case "product.price_changed":
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip className="bg-stone-100 text-stone-500 line-through">{d.from} LE</Chip>
          <span className="text-stone-400">→</span>
          <Chip className="bg-emerald-100 text-emerald-800">{d.to} LE</Chip>
        </div>
      );
   case "order.payment_changed":
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Chip>{d.from}</Chip>
      <span className="text-stone-400">→</span>
      <Chip className="bg-emerald-100 text-emerald-800">{d.to}</Chip>
    </div>
  );
case "order.assigned": {
  const from = d.from as string | undefined;
  const to = d.assigned_to as string | undefined;

  if (!to) {
    return (
      <div className="mt-2">
        <Chip className="bg-stone-100 text-stone-500">was {from ?? "assigned"}</Chip>
      </div>
    );
  }
  if (from) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Chip className="bg-stone-100 text-stone-500 line-through">{from}</Chip>
        <span className="text-stone-400">→</span>
        <Chip className="bg-violet-100 text-violet-800">{to}</Chip>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <Chip className="bg-violet-100 text-violet-800">
        to {to === row.admin_name ? "themselves" : to}
      </Chip>
    </div>
  );
}
   default: {
  const changes = (d.changes ?? {}) as Record<string, { from: unknown; to: unknown }>;
  const keys = Object.keys(changes);
  if (keys.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {keys.map((k) => (
        <div key={k} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium capitalize text-stone-500">{k.replace(/_/g, " ")}</span>
          <Chip className="bg-stone-100 text-stone-500 line-through">{fmt(k, changes[k].from)}</Chip>
          <span className="text-stone-400">→</span>
          <Chip className="bg-emerald-100 text-emerald-800">{fmt(k, changes[k].to)}</Chip>
        </div>
      ))}
    </div>
  );
}
  }
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

function dayLabel(key: string) {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(key + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
function verbFor(row: Row, fallback: string) {
  if (row.action === "order.assigned") {
    const d = row.details ?? {};
    if (!d.assigned_to) return "unassigned";
    if (d.from) return "reassigned";
  }
  return fallback;
}
const SUFFIX: Record<string, { icon: string; tint: string; verb: string }> = {
  created: { icon: "✨", tint: "bg-emerald-100", verb: "created" },
  updated: { icon: "✏️", tint: "bg-stone-100", verb: "edited" },
  deleted: { icon: "🗑️", tint: "bg-rose-100", verb: "deleted" },
};

function getAction(action: string) {
  return ACTIONS[action] ?? SUFFIX[action.split(".")[1]] ?? FALLBACK;
}

function fmt(key: string, v: unknown) {
  if (v === null || v === undefined || v === "") return "empty";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  const out = s.length > 40 ? s.slice(0, 40) + "…" : s;
  return /price/i.test(key) ? `${out} LE` : out;
}
const TYPE_LABELS: Record<string, string> = {
  order: "Order",
  custom_order: "Custom order",
  product: "Product",
  promotion: "Promotion",
  review: "Review",
  customer: "Customer",
  scent: "Scent",
};

function typeLabel(t: string) {
  return TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export default async function ActivityPage() {
  if (!(await getAdmin())) redirect("/admin/login");

  const { data, error } = await supabaseAdmin
    .from("admin_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return <p className="p-6 text-rose-700">Failed to load activity log.</p>;

  const rows = (data ?? []) as Row[];

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = dayKey(row.created_at);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Activity Log</h1>
        <p className="mt-1 text-sm text-stone-500">Who changed what, and when.</p>
      </header>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-amber-100 bg-white/70 p-10 text-center text-stone-500">
          <div className="mb-2 text-3xl">🕯️</div>
          Nothing here yet. Admin actions will show up as they happen.
        </div>
      )}

      <div className="space-y-8">
        {[...groups.entries()].map(([key, dayRows]) => (
          <section key={key}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              {dayLabel(key)}
            </h2>
            <ul className="space-y-3">
              {dayRows.map((row) => {
const a = getAction(row.action);
                const label = row.entity_label ?? `${row.entity_type} ${row.entity_id}`;
                return (
                  <li
                    key={row.id}
                    className="flex gap-3 rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${a.tint}`}>
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        {typeLabel(row.entity_type)}
                      </span>
                      <p className="text-sm leading-relaxed text-stone-700">
                        <span className="font-semibold text-stone-900">{row.admin_name}</span> {verbFor(row, a.verb)}{" "}
                        <span className="font-semibold text-stone-900">{label}</span>
                      </p>
                      <Details row={row} />
                    </div>
                    <time className="shrink-0 pt-0.5 text-xs text-stone-400">{timeOf(row.created_at)}</time>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}