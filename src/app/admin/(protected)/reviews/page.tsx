"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";

type Review = {
  id: string;
  created_at: string;
  customer_name: string;
  rating: number;
  body: string;
  is_featured: boolean;
  is_published: boolean;
};

const EMPTY_FORM = { customer_name: "", rating: 5, body: "" };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setReviews((data ?? []) as Review[]);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.body.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      customer_name: form.customer_name.trim(),
      rating: form.rating,
      body: form.body.trim(),
    });

    if (error) {
      alert(`Couldn't add review: ${error.message}`);
      setSaving(false);
      return;
    }

    setForm(EMPTY_FORM);
    setSaving(false);
    loadReviews();
  }

  async function toggleField(id: string, field: "is_featured" | "is_published", value: boolean) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").update({ [field]: value }).eq("id", id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
      setBusyId(null);
      return;
    }

    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This can't be undone.")) return;

    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      setBusyId(null);
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));
    setBusyId(null);
  }

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="px-6 py-8 md:px-10 md:py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: "#000000" }}>
          Reviews
        </h1>
        <p className="text-sm mb-8" style={{ color: MUTED }}>
          Add reviews shared with you on Instagram. New reviews are published immediately.
        </p>

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 mb-8 flex flex-col gap-4"
          style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                Customer name
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
                Rating
              </label>
              <select
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)} ({n})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
              Review text
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
          >
            {saving ? "Adding…" : "Add review"}
          </button>
        </form>

        {/* List */}
        {loading && (
          <p className="text-sm" style={{ color: MUTED }}>
            Loading reviews...
          </p>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: "#A34848" }}>
            Couldn't load reviews: {error}
          </p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            No reviews yet — add the first one above.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl px-5 py-4"
              style={{
                backgroundColor: CARD_BG,
                border: r.is_featured ? `1.5px solid ${ACCENT}` : "1px solid rgba(0,0,0,0.08)",
                opacity: r.is_published ? 1 : 0.5,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                    {r.customer_name}
                  </p>
                  <p className="text-xs" style={{ color: "#B8862F" }}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </p>
                </div>
                {r.is_featured && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                    style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                  >
                    Featured
                  </span>
                )}
              </div>

              <p className="text-sm mb-3" style={{ color: "#000000" }}>
                {r.body}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => toggleField(r.id, "is_featured", !r.is_featured)}
                  className="underline disabled:opacity-40"
                  style={{ color: ACCENT }}
                >
                  {r.is_featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => toggleField(r.id, "is_published", !r.is_published)}
                  className="underline disabled:opacity-40"
                  style={{ color: "#000000" }}
                >
                  {r.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleDelete(r.id)}
                  className="underline disabled:opacity-40 ml-auto"
                  style={{ color: "#A34848" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}