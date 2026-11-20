"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { DEFAULT_CATEGORY_ACCENT, accentOf } from "@/lib/categoryColors";

type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  accent: string | null;
};

const PRESET_COLORS = [
  { name: "Taupe", hex: "#8C8680" },
  { name: "Pink", hex: "#D8A1AF" },
  { name: "Periwinkle", hex: "#6E86C7" },
  { name: "Sage", hex: "#8FAA82" },
  { name: "Lavender", hex: "#9B8AB8" },
  { name: "Terracotta", hex: "#DE4B33" },
  { name: "Gold", hex: "#C9A66B" },
  { name: "Teal", hex: "#5F8A8B" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  // What's typed in the hex box (can be half-finished while typing)
  const [hexText, setHexText] = useState(value);

  // Keep the box in step when the color changes from a swatch or the wheel
  useEffect(() => {
    setHexText(value);
  }, [value]);

  function handleHexChange(raw: string) {
    // Always show a leading # and only allow hex characters
    const cleaned = "#" + raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexText(cleaned);

    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onChange(cleaned.toLowerCase());
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          title={c.name}
          aria-label={c.name}
          onClick={() => onChange(c.hex)}
          className="h-8 w-8 rounded-full"
          style={{
            backgroundColor: c.hex,
            border:
              value.toLowerCase() === c.hex.toLowerCase()
                ? "3px solid #000000"
                : "1.5px solid rgba(0,0,0,0.15)",
          }}
        />
      ))}

      {/* Rainbow circle: opens the full color picker */}
      <label
        title="Pick any color"
        className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-full"
        style={{
          background:
            "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          border: "1.5px solid rgba(0,0,0,0.15)",
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pick any color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      {/* Hex code box, with a preview of the current color */}
      <div
        className="flex items-center gap-2 rounded-xl px-2 py-1"
        style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF" }}
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: value, border: "1px solid rgba(0,0,0,0.15)" }}
        />
        <input
          value={hexText}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#8C8680"
          maxLength={7}
          spellCheck={false}
          aria-label="Hex color code"
          className="w-[84px] bg-transparent text-sm font-semibold uppercase outline-none"
          style={{ color: "#000000" }}
        />
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_CATEGORY_ACCENT);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [colorEditId, setColorEditId] = useState<string | null>(null);
  const [colorDraft, setColorDraft] = useState(DEFAULT_CATEGORY_ACCENT);

  async function load() {
    const supabase = createClient();

    const [catRes, prodRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name, sort_order, is_visible, accent")
        .order("sort_order", { ascending: true }),
      supabase.from("products").select("category").is("deleted_at", null),
    ]);

    if (catRes.error) {
      setError(catRes.error.message);
      setLoading(false);
      return;
    }

    const countMap: Record<string, number> = {};
    (prodRes.data ?? []).forEach((p: { category: string | null }) => {
      const k = p.category ?? "";
      countMap[k] = (countMap[k] ?? 0) + 1;
    });

    // "customizable" is an internal category for the builder products, so it isn't managed here
    setCategories(
      ((catRes.data ?? []) as Category[]).filter((c) => c.slug !== "customizable")
    );
    setCounts(countMap);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    const name = newName.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    // URL name is generated automatically from the name (and made unique if needed)
    let slug = slugify(name) || `category-${Date.now().toString(36)}`;
    const base = slug;
    let n = 2;
    while (categories.some((c) => c.slug === slug) || slug === "customizable") {
      slug = `${base}-${n}`;
      n++;
    }

    setAdding(true);
    setError(null);

    const nextOrder =
      Math.max(0, ...categories.filter((c) => c.sort_order < 90).map((c) => c.sort_order)) + 1;

    const supabase = createClient();
    const { error: insertError } = await supabase.from("categories").insert({
      name,
      slug,
      sort_order: nextOrder,
      is_visible: true,
      accent: newColor,
    });

    setAdding(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    logAdminActivity({
      action: "category.created",
      entityType: "category",
      entityId: slug,
      entityLabel: name,
      details: { slug, accent: newColor },
    });

    setNewName("");
    setNewColor(DEFAULT_CATEGORY_ACCENT);
    await load();
    router.refresh();
  }

  async function saveRename(cat: Category) {
    const name = editName.trim();
    if (!name) {
      setError("Name can't be empty.");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", cat.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    logAdminActivity({
      action: "category.renamed",
      entityType: "category",
      entityId: cat.slug,
      entityLabel: name,
      details: { from: cat.name, to: name },
    });

    setEditingId(null);
    setError(null);
    await load();
    router.refresh();
  }

  async function saveColor(cat: Category) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("categories")
      .update({ accent: colorDraft })
      .eq("id", cat.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    logAdminActivity({
      action: "category.color_changed",
      entityType: "category",
      entityId: cat.slug,
      entityLabel: cat.name,
      details: { from: cat.accent, to: colorDraft },
    });

    setColorEditId(null);
    setError(null);
    await load();
    router.refresh();
  }

  async function toggleVisible(cat: Category) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("categories")
      .update({ is_visible: !cat.is_visible })
      .eq("id", cat.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    logAdminActivity({
      action: "category.visibility_changed",
      entityType: "category",
      entityId: cat.slug,
      entityLabel: cat.name,
      details: { visible: !cat.is_visible },
    });

    setError(null);
    await load();
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= categories.length) return;

    const a = categories[index];
    const b = categories[other];

    const supabase = createClient();
    const [r1, r2] = await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);

    if (r1.error || r2.error) {
      setError((r1.error ?? r2.error)!.message);
      return;
    }

    setError(null);
    await load();
    router.refresh();
  }

  async function handleDelete(cat: Category) {
    if ((counts[cat.slug] ?? 0) > 0) {
      setError(`"${cat.name}" still has products. Move them to another category first.`);
      return;
    }
    if (!window.confirm(`Delete the "${cat.name}" category?`)) return;

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", cat.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    logAdminActivity({
      action: "category.deleted",
      entityType: "category",
      entityId: cat.slug,
      entityLabel: cat.name,
      details: { slug: cat.slug },
    });

    setError(null);
    await load();
    router.refresh();
  }

  const inputStyle = {
    border: "1.5px solid rgba(0,0,0,0.15)",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push("/admin/products")}
        className="mb-3 text-xs font-semibold"
        style={{ color: "rgba(0,0,0,0.55)" }}
      >
        ← Products
      </button>

      <h1 className="mb-6 font-serif text-3xl font-bold" style={{ color: "#000000" }}>
        Categories
      </h1>

      {error && (
        <p className="mb-4 text-sm font-semibold" style={{ color: "#DE4B33" }}>
          {error}
        </p>
      )}

      {/* ADD */}
      <section
        className="mb-8 rounded-3xl p-5"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <h2
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#DE4B33" }}
        >
          Add a category
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(0,0,0,0.6)" }}
            >
              Name
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="e.g. Gift Sets"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(0,0,0,0.6)" }}
            >
              Color
            </label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6", opacity: adding ? 0.6 : 1 }}
          >
            {adding ? "Adding..." : "Add Category"}
          </button>
        </div>
      </section>

      {/* LIST */}
      {loading ? (
        <p style={{ color: "#000000" }}>Loading...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat, index) => {
            const count = counts[cat.slug] ?? 0;
            const editing = editingId === cat.id;
            const colorEditing = colorEditId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  backgroundColor: "#FFF9F0",
                  opacity: cat.is_visible ? 1 : 0.65,
                }}
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-xs leading-none"
                    style={{ color: "#000000", opacity: index === 0 ? 0.2 : 0.7 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === categories.length - 1}
                    aria-label="Move down"
                    className="mt-1 text-xs leading-none"
                    style={{
                      color: "#000000",
                      opacity: index === categories.length - 1 ? 0.2 : 0.7,
                    }}
                  >
                    ▼
                  </button>
                </div>

                <span
                  aria-hidden="true"
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: accentOf(cat.accent),
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}
                />

                <div className="min-w-0 flex-1">
                  {editing ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(cat);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                      style={inputStyle}
                    />
                  ) : (
                    <p className="truncate font-serif text-base font-bold" style={{ color: "#000000" }}>
                      {cat.name}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {count} product{count === 1 ? "" : "s"}
                    {!cat.is_visible && " · hidden on site"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveRename(cat)}
                        style={{ color: "#DE4B33" }}
                        className="underline"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ color: "rgba(0,0,0,0.55)" }}
                        className="underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                        style={{ color: "#000000" }}
                        className="underline"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (colorEditing) {
                            setColorEditId(null);
                          } else {
                            setColorEditId(cat.id);
                            setColorDraft(accentOf(cat.accent));
                          }
                        }}
                        style={{ color: "#000000" }}
                        className="underline"
                      >
                        Color
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVisible(cat)}
                        style={{ color: "#000000" }}
                        className="underline"
                      >
                        {cat.is_visible ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        style={{ color: "#DE4B33" }}
                        className="underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {colorEditing && (
                  <div
                    className="flex w-full flex-col gap-3 rounded-xl p-3"
                    style={{ backgroundColor: "#EFE3C4" }}
                  >
                    <ColorPicker value={colorDraft} onChange={setColorDraft} />
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => saveColor(cat)}
                        className="rounded-full px-4 py-1.5"
                        style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
                      >
                        Save color
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorEditId(null)}
                        className="underline"
                        style={{ color: "rgba(0,0,0,0.55)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}