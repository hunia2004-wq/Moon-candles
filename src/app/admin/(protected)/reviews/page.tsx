"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCENT = "#DE4B33";
const BG = "#FFF4E6";
const CARD_BG = "#FFF9F0";
const MUTED = "rgba(0,0,0,0.55)";
const BORDER = "rgba(0,0,0,0.08)";
const DANGER = "#A34848";

const STAR_LOW = ACCENT;
const STAR_MID = "#B8862F";
const STAR_HIGH = "#7D9470";

function starColor(rating: number) {
  if (rating <= 2) return STAR_LOW;
  if (rating === 3) return STAR_MID;
  return STAR_HIGH;
}

type Review = {
  id: string;
  created_at: string;
  customer_name: string;
  rating: number;
  body: string;
  is_published: boolean;
};

const EMPTY_FORM = { customer_name: "", rating: 5, body: "" };

const inputStyle = {
  border: "1.5px solid rgba(0,0,0,0.15)",
  backgroundColor: "#FFFFFF",
  color: "#000000",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadReviews();
  }, []);

   async function loadReviews(silent = false) {
    if (!silent) setLoading(true);
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

  async function togglePublished(id: string, value: boolean) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").update({ is_published: value }).eq("id", id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
      setBusyId(null);
      return;
    }

    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_published: value } : r)));
    setBusyId(null);
  }

  function startEdit(r: Review) {
    setEditingId(r.id);
    setEditForm({ customer_name: r.customer_name, rating: r.rating, body: r.body });
  }

  async function saveEdit(id: string) {
    if (!editForm.customer_name.trim() || !editForm.body.trim()) return;

    setBusyId(id);
    const supabase = createClient();
    const payload = {
      customer_name: editForm.customer_name.trim(),
      rating: editForm.rating,
      body: editForm.body.trim(),
    };
    const { error } = await supabase.from("reviews").update(payload).eq("id", id);

    if (error) {
      alert(`Couldn't save: ${error.message}`);
      setBusyId(null);
      return;
    }

    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    setEditingId(null);
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
          style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
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
                style={inputStyle}
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
                style={inputStyle}
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
              style={inputStyle}
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
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "#F5DADA", color: DANGER }}>
            Couldn't load reviews: {error}
          </p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-sm"
            style={{ backgroundColor: CARD_BG, color: MUTED, border: `1px solid ${BORDER}` }}
          >
            No reviews yet — add the first one above.
          </div>
        )}

        {reviews.length > 0 && (
          <p className="text-xs font-semibold mb-3" style={{ color: MUTED }}>
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {reviews.map((r) => {
            const isEditing = editingId === r.id;
            const color = starColor(r.rating);

            return (
              <div
                key={r.id}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: color, opacity: r.is_published ? 1 : 0.35 }}
                />

                {isEditing ? (
                  <div className="pl-7 pr-5 py-5 flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                      <input
                        type="text"
                        value={editForm.customer_name}
                        onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                        style={inputStyle}
                      />
                      <select
                        value={editForm.rating}
                        onChange={(e) => setEditForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                        style={inputStyle}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {"★".repeat(n)} ({n})
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={editForm.body}
                      onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <div className="pl-7 pr-5 pt-5 pb-4" style={{ opacity: r.is_published ? 1 : 0.55 }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-base font-bold"
                        style={{ backgroundColor: `${color}26`, color }}
                      >
                        {r.customer_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#000000" }}>
                          {r.customer_name}
                        </p>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {new Date(r.created_at).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-sm tracking-wide" style={{ color }}>
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </p>
                        {!r.is_published && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: "rgba(0,0,0,0.06)", color: MUTED }}
                          >
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[15px] leading-relaxed" style={{ color: "#000000" }}>
                      {r.body}
                    </p>
                  </div>
                )}

                <div
                  className="flex flex-wrap items-center gap-2 pl-7 pr-5 py-3"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => saveEdit(r.id)}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
                      >
                        {busyId === r.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setEditingId(null)}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={{ border: "1px solid rgba(0,0,0,0.15)", color: "#000000" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => togglePublished(r.id, !r.is_published)}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={
                          r.is_published
                            ? { border: "1px solid rgba(0,0,0,0.15)", color: "#000000" }
                            : { backgroundColor: ACCENT, color: "#FFFFFF" }
                        }
                      >
                        {r.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => startEdit(r)}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={{ border: "1px solid rgba(0,0,0,0.15)", color: "#000000" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleDelete(r.id)}
                        className="ml-auto rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={{ color: DANGER }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}