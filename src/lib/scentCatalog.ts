import { createClient } from "@/lib/supabase/client";

// The master scent list managed on /admin/scents
export async function loadScentCatalog(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("scent_catalog").select("name").is("deleted_at", null).order("name");
  return (data ?? []).map((r: any) => r.name as string);
}

// Call after saving a product so scents typed into its form also join the master list
export async function syncScentsToCatalog(scents: string[]) {
  const names = [...new Set(scents.map((s) => s.trim()).filter(Boolean))];
  if (names.length === 0) return;
  const supabase = createClient();
  await supabase
    .from("scent_catalog")
    .upsert(names.map((name) => ({ name, deleted_at: null, deleted_product_ids: null })), { onConflict: "name" });
}
