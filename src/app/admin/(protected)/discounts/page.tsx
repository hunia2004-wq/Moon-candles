"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

type Promotion = {
  id: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
  code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  show_on_homepage: boolean;
  sort_order: number;
};

type ProductOption = {
  id: number;
  name: string;
};

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  link_url: "/shop",
  code: "",
  discount_type: "",
  discount_value: "",
  starts_at: "",
  ends_at: "",
  usage_limit: "",
  show_on_homepage: true,
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productNamesByPromo, setProductNamesByPromo] = useState<Record<string, string[]>>({});
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
    loadProducts();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const promos = (data ?? []) as Promotion[];
    setPromotions(promos);
    setLoading(false);

    if (promos.length > 0) {
      loadPromotionProductNames(promos.map((p) => p.id));
    }
  }

  // Fetches which products are attached to each promotion, for display
  // in the list. Always re-derived from promotion_products + products,
  // so a product renamed or removed later is reflected automatically.
  async function loadPromotionProductNames(promoIds: string[]) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("promotion_products")
      .select("promotion_id, products(name)")
      .in("promotion_id", promoIds);

    if (error || !data) return;

    const grouped: Record<string, string[]> = {};
    for (const row of data as any[]) {
      const name = row.products?.name;
      if (!name) continue;
      if (!grouped[row.promotion_id]) grouped[row.promotion_id] = [];
      grouped[row.promotion_id].push(name);
    }
    setProductNamesByPromo(grouped);
  }

  // Live product list for the picker — always current, so a product
  // added after this page first loaded still shows up next time the
  // form is opened (and even while it's open, since this refetches on
  // every "+ New promotion" click via toggleForm below).
  async function loadProducts() {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("id, name").order("name", { ascending: true });

    if (error || !data) return;
    setProducts(data as ProductOption[]);
  }

  function toggleForm() {
    setShowForm((s) => {
      const next = !s;
      if (next) {
        // Refresh the product list every time the form opens, so newly
        // added products are always available to pick from.
        loadProducts();
      }
      return next;
    });
  }

  function toggleProductSelected(id: number) {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    const supabase = createClient();

    const { data: inserted, error } = await supabase
      .from("promotions")
      .insert({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        link_url: form.link_url.trim() || null,
        code: form.code.trim() || null,
        discount_type: form.discount_type || null,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        show_on_homepage: form.show_on_homepage,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      alert(`Couldn't add promotion: ${error?.message}`);
      setSaving(false);
      return;
    }

    if (selectedProductIds.length > 0) {
      const { error: linkError } = await supabase.from("promotion_products").insert(
        selectedProductIds.map((product_id) => ({
          promotion_id: inserted.id,
          product_id,
        }))
      );

      if (linkError) {
        alert(`Promotion was created, but couldn't attach products: ${linkError.message}`);
      }
    }

    setForm(EMPTY_FORM);
    setSelectedProductIds([]);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function toggleField(id: string, field: "is_active" | "show_on_homepage", value: boolean) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("promotions").update({ [field]: value }).eq("id", id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
      setBusyId(null);
      return;
    }

    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion? This can't be undone.")) return;

    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("promotions").delete().eq("id", id);

    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      setBusyId(null);
      return;
    }

    setPromotions((prev) => prev.filter((p) => p.id !== id));
    setBusyId(null);
  }

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
            Promotions
          </h1>
          <button
            type="button"
            onClick={toggleForm}
            className="rounded-full px-5 py-2 text-sm font-medium"
            style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
          >
            {showForm ? "Cancel" : "+ New promotion"}
          </button>
        </div>
        <p className="text-sm mb-8" style={{ color: MUTED }}>
          Active promotions marked "Show on homepage" appear as a banner customers can tap, above the site navigation.
          If you pick products below, their discounted price will also show directly on the shop page.
        </p>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="rounded-2xl p-5 mb-8 flex flex-col gap-4"
            style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Buy 1 Get 1 Free"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                Subtitle
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="On all 150ml candles, this week only"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                Apply to specific products (optional)
              </label>
              <p className="text-xs mb-2" style={{ color: MUTED }}>
                Pick which products this discount applies to. Their discounted price will show right on the shop page.
                Leave all unchecked if this promo isn't tied to specific products.
              </p>

              <div
                className="max-h-56 overflow-y-auto rounded-xl p-2 flex flex-col gap-1"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF" }}
              >
                {products.length === 0 && (
                  <p className="text-xs px-2 py-2" style={{ color: MUTED }}>
                    No products found.
                  </p>
                )}
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer"
                    style={{
                      backgroundColor: selectedProductIds.includes(product.id) ? "#EFE3C4" : "transparent",
                      color: "#000000",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelected(product.id)}
                    />
                    {product.name}
                  </label>
                ))}
              </div>

              {selectedProductIds.length > 0 && (
                <p className="text-xs mt-1.5" style={{ color: ACCENT }}>
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Links to
                </label>
                <input
                  type="text"
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="/shop"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Discount code (optional)
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="BOGO2026"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Discount type
                </label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                >
                  <option value="">None</option>
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                  <option value="bogo">Buy 1 Get 1</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Value
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Usage limit
                </label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                  placeholder="Unlimited"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Starts
                </label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                  Ends
                </label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm" style={{ color: "#000000" }}>
              <input
                type="checkbox"
                checked={form.show_on_homepage}
                onChange={(e) => setForm((f) => ({ ...f, show_on_homepage: e.target.checked }))}
              />
              Show on homepage banner
            </label>

            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
            >
              {saving ? "Adding…" : "Add promotion"}
            </button>
          </form>
        )}

        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading promotions...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Couldn't load promotions: {error}
          </p>
        )}

        {!loading && !error && promotions.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            No promotions yet.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {promotions.map((p) => {
            const productNames = productNamesByPromo[p.id] ?? [];

            return (
              <div
                key={p.id}
                className="rounded-2xl px-5 py-4"
                style={{
                  backgroundColor: CARD_BG,
                  border: p.is_active ? `1.5px solid ${ACCENT}` : "1px solid rgba(0,0,0,0.08)",
                  opacity: p.is_active ? 1 : 0.55,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                      {p.title}
                    </p>
                    {p.subtitle && (
                      <p className="text-xs" style={{ color: MUTED }}>
                        {p.subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                    style={{
                      backgroundColor: p.is_active ? `${ACCENT}1A` : "rgba(0,0,0,0.06)",
                      color: p.is_active ? ACCENT : MUTED,
                    }}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {productNames.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: ACCENT }}>
                    Applies to: {productNames.join(", ")}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: MUTED }}>
                  {p.code && <span>Code: <strong>{p.code}</strong></span>}
                  {p.usage_limit != null && (
                    <span>
                      Used {p.times_used}/{p.usage_limit}
                    </span>
                  )}
                  {p.ends_at && <span>Ends {new Date(p.ends_at).toLocaleDateString()}</span>}
                  <span>{p.show_on_homepage ? "On homepage" : "Not on homepage"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mt-3">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "is_active", !p.is_active)}
                    className="underline disabled:opacity-40"
                    style={{ color: ACCENT }}
                  >
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "show_on_homepage", !p.show_on_homepage)}
                    className="underline disabled:opacity-40"
                    style={{ color: "#000000" }}
                  >
                    {p.show_on_homepage ? "Remove from homepage" : "Show on homepage"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="underline disabled:opacity-40 ml-auto"
                    style={{ color: "#A34848" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}