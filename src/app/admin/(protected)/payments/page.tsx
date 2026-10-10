"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { logAdminActivity } from "@/lib/logAdminActivity";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.08)";
const GREEN = "#3F8F5C";
const RED = "#A34848";
const FIELD_STYLE = {
  border: "1.5px solid rgba(0,0,0,0.15)",
  backgroundColor: "#FFFFFF",
  color: "#000000",
};

type PaymentOrder = {
  id: string;
  order_no: number | null;
  customer_name: string | null;
  total: number | null;
  shipping_fee: number | null;
  payment_status: string | null;
  completed_at: string | null;
  created_at: string;
  refunded_at: string | null;
  source?: "orders" | "custom_orders";
};

type Expense = {
  id: string;
  spent_on: string;
  description: string | null;
  amount: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// Revenue excludes shipping
function netOf(o: PaymentOrder) {
  return (o.total ?? 0) - (o.shipping_fee ?? 0);
}
function money(n: number) {
  return `${n.toLocaleString()} LE`;
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [busyId, setBusyId] = useState<string | null>(null);

  const [spentOn, setSpentOn] = useState(todayStr());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);
  useAutoRefresh(() => load(true));

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    const supabase = createClient();

        const [ordersRes, expensesRes, customRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_no, customer_name, total, shipping_fee, payment_status, completed_at, created_at, refunded_at")
        .is("deleted_at", null)
        .in("payment_status", ["paid", "refunded"]),
          supabase.from("expenses").select("*").order("spent_on", { ascending: false }),
      supabase
        .from("custom_orders")
        .select("id, order_no, customer_name, price, shipping_fee, payment_status, completed_at, created_at, refunded_at")
        .is("deleted_at", null)
        .in("payment_status", ["paid", "refunded"]),
        ]);
       if (ordersRes.error || expensesRes.error || customRes.error) {
      setError(ordersRes.error?.message ?? expensesRes.error?.message ?? customRes.error?.message ?? "Unknown error");
      setLoading(false);
      return;
    }

    const customAsOrders: PaymentOrder[] = (customRes.data ?? []).map((c: any) => ({
      ...c,
      total: c.price, // custom_orders.price already includes shipping; netOf subtracts shipping_fee
      customer_name: c.customer_name ? `${c.customer_name} (custom)` : "Custom order",
    }));
    setOrders([
      ...((ordersRes.data ?? []) as PaymentOrder[]).map((o) => ({ ...o, source: "orders" as const })),
      ...customAsOrders.map((o) => ({ ...o, source: "custom_orders" as const })),
    ]);
    setExpenses(
      ((expensesRes.data ?? []) as Expense[]).map((e) => ({ ...e, amount: Number(e.amount) }))
    );
    setLoading(false);
  }

  const summary = useMemo(() => {
    // Revenue: orders paid in this month (paid date = completed_at).
    // Refunded orders still count here, because they were paid in their original month.
    const paidThisMonth = orders.filter(
      (o) => monthKey(o.completed_at ?? o.created_at) === month
    );
    const revenue = paidThisMonth.reduce((s, o) => s + netOf(o), 0);

    // Refunds: counted in the month the refund happened.
    const refundedThisMonth = orders.filter(
      (o) => o.payment_status === "refunded" && o.refunded_at && monthKey(o.refunded_at) === month
    );
    const refunds = refundedThisMonth.reduce((s, o) => s + netOf(o), 0);

    const monthExpenses = expenses.filter((e) => e.spent_on.startsWith(month));
    const expensesTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

    return {
           paidThisMonth,
      paidCount: paidThisMonth.length,
      revenue,
      refundedThisMonth,
      refunds,
      monthExpenses,
      expensesTotal,
      netRevenue: revenue - refunds - expensesTotal,
    };
  }, [orders, expenses, month]);

  async function addExpense() {
    const value = Number(amount);
    if (!value || value <= 0) {
      alert("Enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: created, error } = await supabase
      .from("expenses")
      .insert({
        spent_on: spentOn,
        description: description.trim() || null,
        amount: value,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      alert(`Couldn't save: ${error.message}`);
      return;
    }
    logAdminActivity({
      action: "expense.added",
      entityType: "expense",
      entityId: created.id,
      entityLabel: `Expense: ${description.trim() || "No description"}`,
      details: { amount: value, spent_on: spentOn },
    });
    setDescription("");
    setAmount("");
    load(true);
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense? This can't be undone.")) return;
       const before = expenses.find((e) => e.id === id);
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    logAdminActivity({
      action: "expense.deleted",
      entityType: "expense",
      entityId: id,
      entityLabel: `Expense: ${before?.description || "No description"}`,
      details: { snapshot: before ?? null },
    });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function tableFor(o: PaymentOrder) {
    return o.source === "custom_orders" ? "custom_orders" : "orders";
  }

  async function undoPayment(o: PaymentOrder) {
    const wasRefunded = o.payment_status === "refunded";
    const message = wasRefunded
      ? "Undo this refund? The order goes back to paid and counts as revenue again."
      : "Mark this order as unpaid? It leaves the revenue totals and goes back to Active as Pending.";
    if (!confirm(message)) return;

    const patch = wasRefunded
      ? { payment_status: "paid", refunded_at: null }
      : { payment_status: "unpaid", status: "pending", completed_at: null, refunded_at: null };

    setBusyId(o.id);
    const supabase = createClient();
    const { error } = await supabase.from(tableFor(o)).update(patch).eq("id", o.id);
    setBusyId(null);
    if (error) {
      alert(`Couldn't save: ${error.message}`);
      return;
    }

    const isCustom = o.source === "custom_orders";
    logAdminActivity({
      action: "order.payment_changed",
      entityType: isCustom ? "custom_order" : "order",
      entityId: o.id,
      entityLabel: `${isCustom ? "Custom order" : "Order"} #${o.id.slice(0, 8)}`,
      details: { from: o.payment_status, to: patch.payment_status, via: "payments page" },
    });

    setOrders((prev) =>
      wasRefunded
        ? prev.map((x) => (x.id === o.id ? { ...x, payment_status: "paid", refunded_at: null } : x))
        : prev.filter((x) => x.id !== o.id)
    );
  }

  async function deleteOrderRow(o: PaymentOrder) {
    if (!confirm("Move this order to Recently Deleted? It will be removed from the totals.")) return;

    setBusyId(o.id);
    const supabase = createClient();
    const { error } = await supabase
      .from(tableFor(o))
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", o.id);
    setBusyId(null);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    window.dispatchEvent(new Event("recently-deleted-changed"));

    const isCustom = o.source === "custom_orders";
    logAdminActivity({
      action: "order.deleted",
      entityType: isCustom ? "custom_order" : "order",
      entityId: o.id,
      entityLabel: `${isCustom ? "Custom order" : "Order"} #${o.id.slice(0, 8)}`,
      details: { order_no: o.order_no, total: o.total, via: "payments page" },
    });

    setOrders((prev) => prev.filter((x) => x.id !== o.id));
  }

  function rowActions(o: PaymentOrder) {
    const busy = busyId === o.id;
    return (
      <div className="mt-2 flex items-center gap-4 pt-2" style={{ borderTop: `1px dashed ${BORDER}` }}>
        <button
          type="button"
          onClick={() => undoPayment(o)}
          disabled={busy}
          className="text-xs font-semibold underline disabled:opacity-40"
          style={{ color: "#7A6A58" }}
        >
          {o.payment_status === "refunded" ? "Undo refund" : "Mark unpaid"}
        </button>
        <button
          type="button"
          onClick={() => deleteOrderRow(o)}
          disabled={busy}
          className="ml-auto text-xs font-semibold underline disabled:opacity-40"
          style={{ color: RED }}
        >
          Delete order
        </button>
      </div>
    );
  }

  const card = { backgroundColor: CARD_BG, border: `1px solid ${BORDER}` };

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-4 py-6 md:px-10 md:py-10 max-w-5xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
              Payments
            </h1>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              Revenue excludes shipping fees
            </p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={FIELD_STYLE}
          />
        </div>

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading payments...
          </p>
        )}
        {error && (
          <p className="text-sm rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "#F5DADA", color: RED }}>
            Couldn't load payments: {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Net revenue */}
            <div className="rounded-2xl px-5 py-5 mb-3" style={card}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                Net revenue for the month
              </p>
              <p
                className="font-serif text-4xl font-bold mt-1"
                style={{ color: summary.netRevenue < 0 ? RED : GREEN }}
              >
                {money(summary.netRevenue)}
              </p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Revenue − refunds − material expenses
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="rounded-2xl px-5 py-4" style={card}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                  Revenue
                </p>
                <p className="font-serif text-2xl font-bold" style={{ color: GREEN }}>
                  {money(summary.revenue)}
                </p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {summary.paidCount} paid order{summary.paidCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-2xl px-5 py-4" style={card}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                  Refunds
                </p>
                <p className="font-serif text-2xl font-bold" style={{ color: RED }}>
                  −{money(summary.refunds)}
                </p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {summary.refundedThisMonth.length} refunded order
                  {summary.refundedThisMonth.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-2xl px-5 py-4" style={card}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                  Material expenses
                </p>
                <p className="font-serif text-2xl font-bold" style={{ color: RED }}>
                  −{money(summary.expensesTotal)}
                </p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {summary.monthExpenses.length} entr{summary.monthExpenses.length !== 1 ? "ies" : "y"}
                </p>
              </div>
            </div>

                                   {/* Paid orders */}
            {summary.paidThisMonth.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-serif font-bold mb-2" style={{ color: "#000000" }}>
                  Paid this month
                </h2>
                <div className="flex flex-col gap-2">
                  {[...summary.paidThisMonth]
                    .sort(
                      (a, b) =>
                        new Date(b.completed_at ?? b.created_at).getTime() -
                        new Date(a.completed_at ?? a.created_at).getTime()
                    )
                    .map((o) => (
                      <div key={o.id} className="rounded-xl px-4 py-3 text-sm" style={card}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate" style={{ color: "#000000" }}>
                              #{o.order_no ?? "–"} · {o.customer_name || "Unnamed customer"}
                            </p>
                            <p className="text-xs" style={{ color: MUTED }}>
                              {new Date(o.completed_at ?? o.created_at).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                              })}
                              {o.payment_status === "refunded" ? " · refunded later" : ""}
                            </p>
                          </div>
                          <span className="font-semibold" style={{ color: GREEN }}>
                            {money(netOf(o))}
                          </span>
                        </div>
                        {rowActions(o)}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Refunded orders */}
            {summary.refundedThisMonth.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-serif font-bold mb-2" style={{ color: "#000000" }}>
                  Refunded this month
                </h2>
                <div className="flex flex-col gap-2">
                  {summary.refundedThisMonth.map((o) => (
                    <div key={o.id} className="rounded-xl px-4 py-3 text-sm" style={card}>
                      <div className="flex items-center justify-between gap-3">
                        <span style={{ color: "#000000" }}>
                          Moon #{o.order_no ?? "–"} · {o.customer_name || "Unnamed customer"}
                        </span>
                        <span className="font-semibold" style={{ color: RED }}>
                          −{money(netOf(o))}
                        </span>
                      </div>
                      {rowActions(o)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log expense */}
            <h2 className="text-lg font-serif font-bold mb-2" style={{ color: "#000000" }}>
              Material expenses
            </h2>
            <div className="rounded-2xl px-4 py-4 mb-3" style={card}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
                  Date
                  <input
                    type="date"
                                        value={spentOn}
                    onChange={(e) => setSpentOn(e.target.value)}
                    className="block w-full min-w-0 max-w-full appearance-none rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={FIELD_STYLE}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs sm:col-span-2" style={{ color: MUTED }}>
                  What was it for?
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Soy wax, wicks, jars"
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={FIELD_STYLE}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs" style={{ color: MUTED }}>
                  Amount (LE)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={FIELD_STYLE}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={addExpense}
                disabled={saving}
                className="mt-3 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
              >
                {saving ? "Saving..." : "Add expense"}
              </button>
            </div>

            {/* Expense list for the month */}
            {summary.monthExpenses.length === 0 ? (
              <div className="rounded-2xl px-5 py-6 text-center text-sm" style={{ ...card, color: MUTED }}>
                No expenses logged for this month.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {summary.monthExpenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                    style={card}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ color: "#000000" }}>
                        {e.description || "No description"}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {e.spent_on}
                      </p>
                    </div>
                    <span className="font-semibold" style={{ color: RED }}>
                      −{money(e.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteExpense(e.id)}
                      className="text-xs font-semibold underline"
                      style={{ color: RED }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}