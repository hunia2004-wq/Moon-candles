"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const INPUT_CLASS = "w-full min-w-0 max-w-full rounded-xl px-4 py-2.5 text-sm outline-none";
const DATE_CLASS = `${INPUT_CLASS} appearance-none`;
const INPUT_STYLE = {
  border: "1.5px solid rgba(0,0,0,0.15)",
  backgroundColor: "#FFFFFF",
  color: "#000000",
};
const LABEL_CLASS = "block text-xs font-semibold mb-1";

const DISCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "", label: "None" },
  { value: "percentage", label: "% off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "bogo", label: "Buy 1 Get 1" },
  { value: "second_item_percent_off", label: "2nd item at X% off" },
  { value: "buy_x_get_y_free", label: "Buy N, get 1 free" },
  { value: "free_gift", label: "Free gift" },
  { value: "min_spend_percent_off", label: "% off over min. spend" },
  { value: "bundle_price", label: "Bundle price" },
  { value: "tiered_quantity_percent_off", label: "Buy N+, get % off" },
  { value: "free_shipping", label: "Free shipping" },
];

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
  min_spend_amount: number | null;
  free_gift_product_id: number | null;
  bundle_quantity: number | null;
  bundle_price: number | null;
   tiered_min_qty: number | null;
  bundle_same_product_only: boolean;

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
  min_spend_amount: "",
  free_gift_product_id: "",
  bundle_quantity: "",
  bundle_price: "",
  tiered_min_qty: "",
  bundle_same_product_only: false,
  
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
  const [editingId, setEditingId] = useState<string | null>(null);

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
    async function loadProductIdsForPromotion(promoId: string): Promise<number[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id")
      .eq("promotion_id", promoId);

    if (error || !data) return [];
    return data.map((row: any) => row.product_id);
  }
    async function startEdit(promo: Promotion) {
    await loadProducts();
    const productIds = await loadProductIdsForPromotion(promo.id);

    setForm({
      title: promo.title,
      subtitle: promo.subtitle ?? "",
      link_url: promo.link_url ?? "/shop",
      code: promo.code ?? "",
      discount_type: promo.discount_type ?? "",
      discount_value: promo.discount_value != null ? String(promo.discount_value) : "",
      starts_at: promo.starts_at ? toLocalDatetimeInputValue(promo.starts_at) : "",
      ends_at: promo.ends_at ? toLocalDatetimeInputValue(promo.ends_at) : "",
      usage_limit: promo.usage_limit != null ? String(promo.usage_limit) : "",
      show_on_homepage: promo.show_on_homepage,
      min_spend_amount: promo.min_spend_amount != null ? String(promo.min_spend_amount) : "",
      free_gift_product_id: "",
      bundle_quantity: promo.bundle_quantity != null ? String(promo.bundle_quantity) : "",
      bundle_price: promo.bundle_price != null ? String(promo.bundle_price) : "",
        tiered_min_qty: promo.tiered_min_qty != null ? String(promo.tiered_min_qty) : "",
  bundle_same_product_only: promo.bundle_same_product_only ?? false,
});
    setSelectedProductIds(productIds);
    setEditingId(promo.id);
    setShowForm(true);
  }

  // datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, but
  // Supabase returns an ISO string in UTC — this converts between them.
  function toLocalDatetimeInputValue(isoString: string): string {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

    function toggleForm() {
    setShowForm((s) => {
      const next = !s;
      if (next) {
        // Refresh the product list every time the form opens, so newly
        // added products are always available to pick from.
        loadProducts();
      } else {
        // Closing (Cancel) always exits edit mode and clears the form.
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSelectedProductIds([]);
      }
      return next;
    });
  }

  function toggleProductSelected(id: number) {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  }

   async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    const supabase = createClient();

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      link_url: form.link_url.trim() || null,
      code: form.code.trim() || null,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value ? Number(form.discount_value) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      show_on_homepage: form.show_on_homepage,
      min_spend_amount: form.min_spend_amount ? Number(form.min_spend_amount) : null,
      free_gift_product_id: form.free_gift_product_id ? Number(form.free_gift_product_id) : null,
      bundle_quantity: form.bundle_quantity ? Number(form.bundle_quantity) : null,
      bundle_price: form.bundle_price ? Number(form.bundle_price) : null,
       tiered_min_qty: form.tiered_min_qty ? Number(form.tiered_min_qty) : null,
  bundle_same_product_only: form.bundle_same_product_only,
};

    const promoId = editingId;

    if (promoId) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", promoId);

      if (error) {
        alert(`Couldn't update promotion: ${error.message}`);
        setSaving(false);
        return;
      }

      // Replace product links wholesale — simplest way to keep them in
      // sync with whatever is checked now.
      const { error: deleteLinkError } = await supabase
        .from("promotion_products")
        .delete()
        .eq("promotion_id", promoId);

      if (deleteLinkError) {
        alert(`Promotion was updated, but couldn't refresh linked products: ${deleteLinkError.message}`);
      } else if (selectedProductIds.length > 0) {
        const { error: linkError } = await supabase.from("promotion_products").insert(
          selectedProductIds.map((product_id) => ({
            promotion_id: promoId,
            product_id,
          }))
        );

        if (linkError) {
          alert(`Promotion was updated, but couldn't attach products: ${linkError.message}`);
        }
      }
    } else {
      const { data: inserted, error } = await supabase.from("promotions").insert(payload).select("id").single();

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
    }

    setForm(EMPTY_FORM);
    setSelectedProductIds([]);
    setEditingId(null);
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
           <div className="px-4 py-6 md:px-10 md:py-10 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif font-bold" style={{ color: "#000000" }}>
            Promotions
          </h1>
                  <button
            type="button"
            onClick={() => {
              if (showForm) {
                toggleForm();
              } else {
                setEditingId(null);
                setForm(EMPTY_FORM);
                setSelectedProductIds([]);
                setShowForm(true);
                loadProducts();
              }
            }}
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
          <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
            {/* 1. BASICS */}
            <FormSection number={1} title="Basics">
              <div>
                <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Buy 1 Get 1 Free"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  required
                />
              </div>

              <div>
                <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="On all 150ml candles, this week only"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Banner links to
                  </label>
                  <select
                    value={form.link_url}
                    onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="/shop">Shop — all products</option>
                    <option value="/shop?category=candles">Shop — candles only</option>
                    <option value="/shop?category=giveaways">Shop — giveaways only</option>
                    {products.map((product) => (
                      <option key={product.id} value={`/product/${product.id}`}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Discount code (optional)
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="BOGO2026"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
            </FormSection>

                      {/* 2. PRODUCTS */}
            <FormSection number={2} title="Products">
              

              {(() => {
                const allSelected =
                  products.length > 0 && selectedProductIds.length === products.length;

                return (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProductIds(allSelected ? [] : products.map((p) => p.id))
                      }
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: allSelected ? "#3F8F5C" : "#FFFFFF",
                        color: allSelected ? "#FFFFFF" : "#3F8F5C",
                        border: "1.5px solid #3F8F5C",
                      }}
                    >
                      <span>{allSelected ? "✓" : "＋"}</span>
                      All products
                    </button>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor:
                          selectedProductIds.length > 0 ? `${ACCENT}1A` : "rgba(0,0,0,0.06)",
                        color: selectedProductIds.length > 0 ? ACCENT : MUTED,
                      }}
                    >
                      {selectedProductIds.length} of {products.length} selected
                    </span>
                  </div>
                );
              })()}

                            <div
                className="max-h-72 overflow-y-auto rounded-2xl p-2.5"
                style={{ backgroundColor: "#EFE3C466", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {products.length === 0 && (
                  <p className="px-1 py-2 text-xs" style={{ color: MUTED }}>
                    No products found.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {products.map((product) => {
                    const selected = selectedProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProductSelected(product.id)}
                        className="flex min-h-[48px] items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors"
                        style={{
                          backgroundColor: selected ? `${ACCENT}14` : "#FFFFFF",
                          border: `1.5px solid ${selected ? ACCENT : "rgba(0,0,0,0.1)"}`,
                        }}
                      >
                        <span
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{
                            backgroundColor: selected ? ACCENT : "transparent",
                            border: `1.5px solid ${selected ? ACCENT : "rgba(0,0,0,0.25)"}`,
                            color: "#FFFFFF",
                          }}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <span
                          className="min-w-0 text-xs font-semibold leading-tight"
                          style={{ color: "#000000" }}
                        >
                          {product.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="self-start text-xs font-semibold underline"
                  style={{ color: MUTED }}
                >
                  Clear selection
                </button>
              )}
            </FormSection>

            {/* 3. DISCOUNT */}
            <FormSection number={3} title="Discount">
              <div>
                <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_TYPES.map((t) => {
                    const selected = form.discount_type === t.value;
                    return (
                      <button
                        key={t.value || "none"}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, discount_type: t.value }))}
                        className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: selected ? "#3F8F5C" : "#FFFFFF",
                          color: selected ? "#FFFFFF" : "#000000",
                          border: `1.5px solid ${selected ? "#3F8F5C" : "rgba(0,0,0,0.15)"}`,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Value
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    placeholder="e.g. 20"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Usage limit
                  </label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                    placeholder="Unlimited"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {form.discount_type === "free_gift" && (
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Minimum spend (EGP)
                  </label>
                  <p className="mb-2 text-xs" style={{ color: MUTED }}>
                    Customers spending over this amount will see a message that a free gift is included — no
                    specific product needed.
                  </p>
                  <input
                    type="number"
                    value={form.min_spend_amount}
                    onChange={(e) => setForm((f) => ({ ...f, min_spend_amount: e.target.value }))}
                    placeholder="e.g. 1000"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              )}

              {form.discount_type === "min_spend_percent_off" && (
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Minimum spend (EGP)
                  </label>
                  <p className="mb-2 text-xs" style={{ color: MUTED }}>
                    Use the Value field above for the percentage off (e.g. 10 for 10%).
                  </p>
                  <input
                    type="number"
                    value={form.min_spend_amount}
                    onChange={(e) => setForm((f) => ({ ...f, min_spend_amount: e.target.value }))}
                    placeholder="e.g. 1000"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              )}

              {form.discount_type === "bundle_price" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                      Bundle quantity
                    </label>
                    <input
                      type="number"
                      value={form.bundle_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, bundle_quantity: e.target.value }))}
                      placeholder="e.g. 2"
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                      Bundle price (EGP)
                    </label>
                    <input
                      type="number"
                      value={form.bundle_price}
                      onChange={(e) => setForm((f) => ({ ...f, bundle_price: e.target.value }))}
                      placeholder="e.g. 900"
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <label className="col-span-2 flex items-center gap-2 text-sm" style={{ color: "#000000" }}>
                    <input
                      type="checkbox"
                      checked={form.bundle_same_product_only}
                      onChange={(e) => setForm((f) => ({ ...f, bundle_same_product_only: e.target.checked }))}
                    />
                    Require the same product (not mixed)
                  </label>
                  <p className="col-span-2 text-xs" style={{ color: MUTED }}>
                    {form.bundle_same_product_only
                      ? 'Requires N units of the SAME product. E.g. "Marble Moon" with quantity 2 and price 1000 EGP means 2 Marble Moons for 1000 EGP.'
                      : "Applies to any combination of the selected products. E.g. quantity 2 and price 1000 EGP means any 2 items from the selected products together for 1000 EGP."}
                  </p>
                </div>
              )}

              {form.discount_type === "tiered_quantity_percent_off" && (
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Minimum quantity
                  </label>
                  <p className="mb-2 text-xs" style={{ color: MUTED }}>
                    Use the Value field above for the percentage off (e.g. 15 for 15%).
                  </p>
                  <input
                    type="number"
                    value={form.tiered_min_qty}
                    onChange={(e) => setForm((f) => ({ ...f, tiered_min_qty: e.target.value }))}
                    placeholder="e.g. 3"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              )}

              {form.discount_type === "buy_x_get_y_free" && (
                <div>
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Quantity to buy
                  </label>
                  <p className="mb-2 text-xs" style={{ color: MUTED }}>
                    e.g. 2 for "buy 2, get 1 free." The Value field above isn't used for this type.
                  </p>
                  <input
                    type="number"
                    value={form.tiered_min_qty}
                    onChange={(e) => setForm((f) => ({ ...f, tiered_min_qty: e.target.value }))}
                    placeholder="e.g. 2"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              )}
            </FormSection>

            {/* 4. SCHEDULE */}
            <FormSection number={4} title="Schedule">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    className={DATE_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="min-w-0">
                  <label className={LABEL_CLASS} style={{ color: "#000000" }}>
                    Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    className={DATE_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.15)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                    Show on homepage banner
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Customers can tap it above the site navigation.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.show_on_homepage}
                  onClick={() => setForm((f) => ({ ...f, show_on_homepage: !f.show_on_homepage }))}
                  className="relative h-7 w-12 flex-shrink-0 rounded-full transition-colors"
                  style={{ backgroundColor: form.show_on_homepage ? "#3F8F5C" : "rgba(0,0,0,0.2)" }}
                >
                  <span
                    className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all"
                    style={{ left: form.show_on_homepage ? "22px" : "2px" }}
                  />
                </button>
              </div>
            </FormSection>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
            >
              {saving ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save changes" : "Add promotion"}
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

                {!loading && !error && !showForm && promotions.length === 0 && (
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
            const typeLabel =
              DISCOUNT_TYPES.find((t) => t.value === (p.discount_type ?? ""))?.label ?? "Promotion";
            const coversAll =
              productNames.length === 0 ||
              (products.length > 0 && productNames.length >= products.length);
            const usedPercent =
              p.usage_limit != null && p.usage_limit > 0
                ? Math.min(100, Math.round((p.times_used / p.usage_limit) * 100))
                : 0;
            const tone = p.is_active ? "#3F8F5C" : "#8A8A8A";

            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: CARD_BG,
                  border: "1px solid rgba(0,0,0,0.08)",
                  opacity: p.is_active ? 1 : 0.6,
                }}
              >
                {/* top band: type + status */}
                <div
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                  style={{ backgroundColor: "#EFE3C4" }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: "#000000" }}
                  >
                    {typeLabel}
                  </span>
                  <span
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: `${tone}26`, color: tone }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* title + code */}
                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="min-w-0">
                    <p className="font-serif text-xl font-bold leading-tight" style={{ color: "#000000" }}>
                      {p.title}
                    </p>
                    {p.subtitle && (
                      <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                        {p.subtitle}
                      </p>
                    )}
                  </div>

                  {p.code && (
                    <span
                      className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-[0.15em]"
                      style={{
                        border: `1.5px dashed ${ACCENT}`,
                        color: ACCENT,
                        backgroundColor: `${ACCENT}0F`,
                      }}
                    >
                      {p.code}
                    </span>
                  )}
                </div>

                {/* applies to */}
                <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                  <span
                    className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: MUTED }}
                  >
                    Applies to
                  </span>

                  {coversAll ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: "#3F8F5C1F", color: "#3F8F5C" }}
                    >
                      All products
                    </span>
                  ) : (
                    <>
                      {productNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
                        >
                          {name}
                        </span>
                      ))}
                      {productNames.length > 3 && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ backgroundColor: "rgba(0,0,0,0.06)", color: MUTED }}
                        >
                          +{productNames.length - 3} more
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* meta row */}
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 text-[11px]"
                  style={{ color: MUTED }}
                >
                  <span>{p.show_on_homepage ? "📢 On homepage banner" : "Not on homepage"}</span>
                  {p.ends_at && (
                    <span>
                      Ends{" "}
                      {new Date(p.ends_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>

                {/* usage bar */}
                {p.usage_limit != null && (
                  <div className="px-4 pb-3">
                    <div className="mb-1 flex justify-between text-[10px]" style={{ color: MUTED }}>
                      <span>Used</span>
                      <span>
                        {p.times_used} / {p.usage_limit}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: `${ACCENT}26` }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${usedPercent}%`, backgroundColor: ACCENT }}
                      />
                    </div>
                  </div>
                )}

                {/* actions */}
                <div
                  className="flex flex-wrap items-center gap-2 px-4 py-3"
                  style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
                    style={{ border: "1.5px solid #000000", color: "#000000" }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "is_active", !p.is_active)}
                    className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                    style={{
                      border: `1.5px solid ${p.is_active ? "#8A8A8A" : "#3F8F5C"}`,
                      color: p.is_active ? "#555555" : "#3F8F5C",
                    }}
                  >
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "show_on_homepage", !p.show_on_homepage)}
                    className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                    style={{ border: "1.5px solid rgba(0,0,0,0.25)", color: "#000000" }}
                  >
                    {p.show_on_homepage ? "Hide from banner" : "Show on banner"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="ml-auto text-[11px] font-semibold underline disabled:opacity-40"
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
function FormSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#EFE3C4" }}>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
        >
          {number}
        </span>
        <h2 className="font-serif text-base font-bold" style={{ color: "#000000" }}>
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
    </section>
  );
}