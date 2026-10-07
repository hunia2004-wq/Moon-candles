"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAdminActivity } from "@/lib/logAdminActivity";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.08)";

type Product = { id: number; name: string; scents: string[] | null };

export default function ScentsPage() {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [openScent, setOpenScent] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState<"all" | "some">("all");
  const [newIds, setNewIds] = useState<number[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const [c, p] = await Promise.all([
      supabase.from("scent_catalog").select("name").is("deleted_at", null).order("name"),
      supabase.from("products").select("id, name, scents").is("deleted_at", null).order("name"),
    ]);
    const failed = c.error || p.error;
    if (failed) {
      setError(failed.message);
      setLoading(false);
      return;
    }
    setError(null);
    setCatalog((c.data ?? []).map((r: any) => r.name));
    setProducts((p.data ?? []) as Product[]);
    setLoading(false);
  }

  async function run(fn: string, args: Record<string, any>) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc(fn, args);
    if (error) alert("Failed: " + error.message);
    await load();
    setBusy(false);
    return !error;
  }

  function usedBy(scent: string) {
    return products.filter((p) => (p.scents ?? []).includes(scent));
  }

  async function addNew() {
    const name = newName.trim();
    if (!name) return;
    if (catalog.some((s) => s.toLowerCase() === name.toLowerCase())) {
      alert(`"${name}" already exists.`);
      return;
    }
    const ok = await run("add_scent", { p_name: name, p_ids: newTarget === "all" ? null : newIds });
    if (ok)
      logAdminActivity({
        action: "scent.created",
        entityType: "scent",
        entityId: name,
        entityLabel: name,
        details: {
          products: newTarget === "all" ? ["All products"] : products.filter((p) => newIds.includes(p.id)).map((p) => p.name),
        },
      });
    setNewName("");
    setNewIds([]);
    setNewTarget("all");
  }

  async function toggleProduct(scent: string, p: Product) {
    const has = (p.scents ?? []).includes(scent);
    const ok = await run(has ? "remove_scent_from_products" : "add_scent", { p_name: scent, p_ids: [p.id] });
    if (ok)
      logAdminActivity({
        action: has ? "scent.removed_from_products" : "scent.added_to_products",
        entityType: "scent",
        entityId: scent,
        entityLabel: scent,
        details: { products: [p.name] },
      });
  }

  async function bulk(scent: string, mode: "add" | "remove") {
    const ok = await run(mode === "add" ? "add_scent" : "remove_scent_from_products", { p_name: scent, p_ids: null });
    if (ok)
      logAdminActivity({
        action: mode === "add" ? "scent.added_to_products" : "scent.removed_from_products",
        entityType: "scent",
        entityId: scent,
        entityLabel: scent,
        details: { products: ["All products"] },
      });
  }

  async function renameScent(scent: string) {
    const next = prompt(`Rename "${scent}" to:`, scent)?.trim();
    if (!next || next === scent) return;
    const clash = catalog.find((s) => s.toLowerCase() === next.toLowerCase() && s !== scent);
    if (clash && !confirm(`"${clash}" already exists. Merge "${scent}" into it?`)) return;
    const ok = await run("rename_scent", { p_old: scent, p_new: clash ?? next });
    if (ok)
      logAdminActivity({
        action: "scent.renamed",
        entityType: "scent",
        entityId: clash ?? next,
        entityLabel: clash ?? next,
        details: { from: scent, to: clash ?? next },
      });
    setOpenScent(clash ?? next);
  }

  async function deleteScent(scent: string) {
    const n = usedBy(scent).length;
    if (!confirm(`Move "${scent}" to Recently Deleted? It will be removed from ${n} product${n !== 1 ? "s" : ""} until you restore it.`)) return;
    const was = usedBy(scent).map((p) => p.name);
    const ok = await run("delete_scent", { p_name: scent, p_at: new Date().toISOString() });
    if (ok)
      logAdminActivity({
        action: "scent.deleted",
        entityType: "scent",
        entityId: scent,
        entityLabel: scent,
        details: { products: was },
      });
    window.dispatchEvent(new Event("recently-deleted-changed"));
    setOpenScent(null);
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((s) => !q || s.toLowerCase().includes(q));
  }, [catalog, search]);

  const pill = (on: boolean) => ({
    backgroundColor: on ? ACCENT : "transparent",
    color: on ? "#FFF4E6" : ACCENT,
    border: `1.5px solid ${ACCENT}`,
  });

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-4 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
            Scents
          </h1>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            {catalog.length} scent{catalog.length !== 1 ? "s" : ""} - changes apply to products straight away.
          </p>
        </div>

        {/* ADD NEW */}
        <div className="mb-6 rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
            Add a scent
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNew()}
              placeholder="New scent name"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
            />
            <button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={addNew}
              className="rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
            >
              Add
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setNewTarget("all")} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={pill(newTarget === "all")}>
              All products
            </button>
            <button type="button" onClick={() => setNewTarget("some")} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={pill(newTarget === "some")}>
              Selected products
            </button>
          </div>

          {newTarget === "some" && (
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm" style={{ color: "#000000" }}>
                  <input
                    type="checkbox"
                    checked={newIds.includes(p.id)}
                    onChange={() =>
                      setNewIds((prev) => (prev.includes(p.id) ? prev.filter((i) => i !== p.id) : [...prev, p.id]))
                    }
                  />
                  {p.name}
                </label>
              ))}
              <p className="col-span-full text-xs" style={{ color: MUTED }}>
                {newIds.length === 0 ? "None selected: the scent is only added to the list." : `${newIds.length} selected`}
              </p>
            </div>
          )}
        </div>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scents"
          className="mb-4 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
        />

        {loading && <p className="text-sm" style={{ color: MUTED }}>Loading...</p>}
        {error && (
          <p className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Could not load: {error}
          </p>
        )}

        {/* LIST */}
        <div className="flex flex-col gap-3" style={{ opacity: busy ? 0.6 : 1 }}>
          {shown.map((scent) => {
            const using = usedBy(scent);
            const isOpen = openScent === scent;
            return (
              <div key={scent} className="overflow-hidden rounded-2xl" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <button
                  type="button"
                  onClick={() => setOpenScent(isOpen ? null : scent)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="font-serif text-lg font-bold" style={{ color: "#000000" }}>
                    {scent}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: MUTED }}>
                      {using.length} of {products.length} products
                    </span>
                    <span className="text-xs transition-transform" style={{ color: MUTED, transform: isOpen ? "rotate(180deg)" : "none" }}>
                      ▾
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <button type="button" disabled={busy} onClick={() => bulk(scent, "add")} className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}>
                        Add to all products
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirm(`Remove "${scent}" from all products? It stays in the list.`) && bulk(scent, "remove")}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                        style={{ border: "1.5px solid rgba(0,0,0,0.25)", color: "#000000" }}
                      >
                        Remove from all
                      </button>
                      <button type="button" disabled={busy} onClick={() => renameScent(scent)} className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ border: "1.5px solid rgba(0,0,0,0.25)", color: "#000000" }}>
                        Rename
                      </button>
                      <button type="button" disabled={busy} onClick={() => deleteScent(scent)} className="ml-auto px-2 py-1.5 text-xs font-semibold underline disabled:opacity-50" style={{ color: "#A34848" }}>
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {products.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm" style={{ color: "#000000" }}>
                          <input type="checkbox" disabled={busy} checked={(p.scents ?? []).includes(scent)} onChange={() => toggleProduct(scent, p)} />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
