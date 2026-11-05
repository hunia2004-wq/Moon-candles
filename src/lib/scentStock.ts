import { createClient } from "@/lib/supabase/client";

export type ScentStockRules = Record<string, number[] | null>;

export async function fetchScentStock(): Promise<ScentStockRules> {
  const supabase = createClient();
  const { data } = await supabase.from("scent_stock").select("scent, product_ids");
  const rules: ScentStockRules = {};
  (data ?? []).forEach((r: any) => {
    rules[r.scent] = r.product_ids ?? null;
  });
  return rules;
}

export function isScentOutOfStock(
  scent: string,
  productId: number,
  rules: ScentStockRules,
  productFlags: string[] = []
) {
  const hasRule = Object.prototype.hasOwnProperty.call(rules, scent);
  const ids = rules[scent];
  const global = hasRule && (ids === null || ids.includes(productId));
  return global || productFlags.includes(scent);
}