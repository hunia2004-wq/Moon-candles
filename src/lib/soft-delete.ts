import { createClient } from "@/lib/supabase/client";

export type SoftTable = "products" | "orders" | "custom_orders";
export const DELETED_EVENT = "recently-deleted-changed";

export async function softDelete(table: SoftTable, ids: (string | number)[]) {
  const supabase = createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (!error && typeof window !== "undefined") {
    window.dispatchEvent(new Event(DELETED_EVENT));
  }
  return { error };
}

export async function countDeleted(): Promise<number> {
  const supabase = createClient();
  const tables: SoftTable[] = ["products", "orders", "custom_orders"];
  const results = await Promise.all(
    tables.map((t) =>
      supabase.from(t).select("id", { count: "exact", head: true }).not("deleted_at", "is", null)
    )
  );
  return results.reduce((sum, r) => sum + (r.count ?? 0), 0);
}
