"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OptionGroupsEditor, {
  groupsFromDrafts,
  type OptionGroupDraft,
} from "../../components/OptionGroupsEditor";
type OptionDraft = {
  key: string;
  name: string;
  price: string;
  imageFiles: File[];
};

type ColorDraft = {
  key: string;
  name: string;
  hex: string;
  price: string;
  imageFiles: File[];
  options: OptionDraft[];
};

function makeKey() {
  return Math.random().toString(36).slice(2);
}

function ImageSlotPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.15)" }}>
          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(files.filter((_, i) => i !== index))}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          >
            ×
          </button>
        </div>
      ))}

      <label
        className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg text-xl"
        style={{ border: "1.5px dashed rgba(0,0,0,0.25)", color: "rgba(0,0,0,0.4)" }}
      >
        +
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const newFiles = Array.from(e.target.files ?? []);
            onChange([...files, ...newFiles]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sizeMl, setSizeMl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState<"candle" | "giveaway">("candle");
     const [optionGroups, setOptionGroups] = useState<OptionGroupDraft[]>([]);
       const [showOrderCounter, setShowOrderCounter] = useState(false);
const [success, setSuccess] = useState(false);
  const [scents, setScents] = useState<string[]>([]);
  const [scentInput, setScentInput] = useState("");
  const [existingScents, setExistingScents] = useState<string[]>([]);

  const [hasColors, setHasColors] = useState(false);
  const [plainImageFiles, setPlainImageFiles] = useState<File[]>([]);
  const [colors, setColors] = useState<ColorDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExistingScents() {
      const supabase = createClient();
      const { data } = await supabase.from("products").select("scents");

      const all = new Set<string>();
      (data ?? []).forEach((row) => {
        (row.scents ?? []).forEach((scent: string) => all.add(scent));
      });

      setExistingScents(Array.from(all).sort());
    }

    loadExistingScents();
  }, []);

  function addScent() {
    const trimmed = scentInput.trim();
    if (trimmed && !scents.includes(trimmed)) {
      setScents([...scents, trimmed]);
    }
    setScentInput("");
  }

  function removeScent(scent: string) {
    setScents(scents.filter((s) => s !== scent));
  }

  function addColor() {
    setColors([
      ...colors,
      { key: makeKey(), name: "", hex: "#CCCCCC", price: "", imageFiles: [], options: [] },
    ]);
  }

  function updateColor(key: string, patch: Partial<ColorDraft>) {
    setColors(colors.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function removeColor(key: string) {
    setColors(colors.filter((c) => c.key !== key));
  }

  function addOption(colorKey: string) {
    setColors(
      colors.map((c) =>
        c.key === colorKey
          ? { ...c, options: [...c.options, { key: makeKey(), name: "", price: "", imageFiles: [] }] }
          : c
      )
    );
  }

  function updateOption(colorKey: string, optionKey: string, patch: Partial<OptionDraft>) {
    setColors(
      colors.map((c) =>
        c.key === colorKey
          ? {
              ...c,
              options: c.options.map((o) => (o.key === optionKey ? { ...o, ...patch } : o)),
            }
          : c
      )
    );
  }

  function removeOption(colorKey: string, optionKey: string) {
    setColors(
      colors.map((c) =>
        c.key === colorKey ? { ...c, options: c.options.filter((o) => o.key !== optionKey) } : c
      )
    );
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    if (files.length === 0) return [];

    const supabase = createClient();
    const urls: string[] = [];

    for (const file of files) {
      const path = `admin-uploads/${Date.now()}-${makeKey()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!price || isNaN(Number(price))) {
      setError("Price must be a number.");
      return;
    }

    if (hasColors && colors.some((c) => !c.name.trim())) {
      setError("Every color needs a name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      let colorsPayload: any[] = [];

      if (hasColors) {
        for (const color of colors) {
          const colorImageUrls = await uploadImages(color.imageFiles);

          const optionsPayload = [];
          for (const option of color.options) {
            const optionImageUrls = await uploadImages(option.imageFiles);
            optionsPayload.push({
              name: option.name.trim(),
              ...(option.price ? { price: Number(option.price) } : {}),
              ...(optionImageUrls.length ? { image_urls: optionImageUrls } : {}),
            });
          }

          colorsPayload.push({
            name: color.name.trim(),
            hex: color.hex || null,
            ...(color.price ? { price: Number(color.price) } : {}),
            ...(colorImageUrls.length ? { image_urls: colorImageUrls } : {}),
            ...(optionsPayload.length ? { options: optionsPayload } : {}),
          });
        }
      } else {
        imageUrls = await uploadImages(plainImageFiles);
      }

      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          category,
          description: description.trim() || null,
          price: Number(price),
          size_ml: sizeMl ? Number(sizeMl) : null,
          is_featured: isFeatured,
          scents,
          colors: colorsPayload,
          image_urls: imageUrls,
          option_groups: groupsFromDrafts(optionGroups),
                    show_order_counter: showOrderCounter,
          stock: 0, // unused — candles are made to order
        })
        .select()
        .single();

     if (insertError) {
  throw new Error(insertError.message);
}

setSuccess(true);
setTimeout(() => {
  router.push("/admin/products");
}, 900);

return; // skip the finally block's setSaving(false) — we're navigating away
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "#000000" }}>
        Add Product
      </h1>

      {error && (
        <p className="mb-4 text-sm font-semibold" style={{ color: "#DE4B33" }}>
          {error}
        </p>
      )}
      {error && (
  <p className="mb-4 text-sm font-semibold" style={{ color: "#DE4B33" }}>
    {error}
  </p>
)}

      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
              Price (EGP)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
              Size (ml) — optional
            </label>
            <input
              value={sizeMl}
              onChange={(e) => setSizeMl(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
            Scents
          </label>

          {existingScents.length > 0 && (
            <div
              className="mb-3 flex flex-col gap-2 rounded-xl p-3"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
            >
              <label
                className="flex items-center gap-3 pb-2"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
              >
                <input
                  type="checkbox"
                  checked={existingScents.every((scent) => scents.includes(scent))}
                  onChange={() => {
                    const allSelected = existingScents.every((scent) => scents.includes(scent));
                    if (allSelected) {
                      setScents(scents.filter((s) => !existingScents.includes(s)));
                    } else {
                      setScents([...new Set([...scents, ...existingScents])]);
                    }
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                  Choose all
                </span>
              </label>

              {existingScents.map((scent) => (
                <label key={scent} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={scents.includes(scent)}
                    onChange={() => {
                      if (scents.includes(scent)) {
                        removeScent(scent);
                      } else {
                        setScents([...scents, scent]);
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm" style={{ color: "#000000" }}>
                    {scent}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={scentInput}
              onChange={(e) => setScentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addScent();
                }
              }}
              placeholder="Add a new scent not listed above"
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
            />
            <button
              type="button"
              onClick={addScent}
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
            >
              Add
            </button>
          </div>

          {scents.filter((s) => !existingScents.includes(s)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {scents
                .filter((s) => !existingScents.includes(s))
                .map((scent) => (
                  <span
                    key={scent}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
                  >
                    {scent}
                    <button type="button" onClick={() => removeScent(scent)} style={{ color: "#DE4B33" }}>
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "candle" | "giveaway")}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          >
            <option value="candle">Candle</option>
            <option value="giveaway">Giveaway</option>
          </select>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-5 w-5"
          />
          <span className="text-sm font-medium" style={{ color: "#000000" }}>
            Featured product
          </span>
        </label>
                <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showOrderCounter}
            onChange={(e) => setShowOrderCounter(e.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
          <span className="text-sm font-medium" style={{ color: "#000000" }}>
            Show "Your Order" counter on the product page
            <span
              className="block text-xs font-normal"
              style={{ color: "rgba(0,0,0,0.55)" }}
            >
              For products ordered in bulk. Customers see a list of what
              they added with + / − buttons under Add to Cart.
            </span>
          </span>
        </label>

        {/* ================================================== */}
        {/* IMAGES / COLORS TOGGLE */}
        {/* ================================================== */}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
            Does this product have colors?
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setHasColors(false)}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{
                backgroundColor: !hasColors ? "#DE4B33" : "transparent",
                color: !hasColors ? "#FFF4E6" : "#000000",
                borderColor: "#DE4B33",
              }}
            >
              No — just photos
            </button>
            <button
              type="button"
              onClick={() => setHasColors(true)}
              className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
              style={{
                backgroundColor: hasColors ? "#DE4B33" : "transparent",
                color: hasColors ? "#FFF4E6" : "#000000",
                borderColor: "#DE4B33",
              }}
            >
              Yes — has colors
            </button>
          </div>
        </div>

        {!hasColors && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
              Product Photos
            </label>
            <ImageSlotPicker files={plainImageFiles} onChange={setPlainImageFiles} />
          </div>
        )}

        {hasColors && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
                Colors
              </label>
              <button
                type="button"
                onClick={addColor}
                className="rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
              >
                + Add Color
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {colors.map((color) => (
                <div
                  key={color.key}
                  className="rounded-2xl p-4"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFDF8" }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(color.key, { hex: e.target.value })}
                      className="h-9 w-9 flex-shrink-0 rounded-lg border-0"
                    />
                    <input
                      value={color.name}
                      onChange={(e) => updateColor(color.key, { name: e.target.value })}
                      placeholder="Color name (e.g. White)"
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                    />
                    <input
                      value={color.price}
                      onChange={(e) => updateColor(color.key, { price: e.target.value })}
                      placeholder="Price (optional)"
                      inputMode="numeric"
                      className="w-28 rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeColor(color.key)}
                      className="flex-shrink-0 text-xs font-semibold underline"
                      style={{ color: "#DE4B33" }}
                    >
                      remove
                    </button>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.5)" }}>
                      Photos for this color
                    </p>
                    <ImageSlotPicker
                      files={color.imageFiles}
                      onChange={(files) => updateColor(color.key, { imageFiles: files })}
                    />
                  </div>

                  <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.5)" }}>
                        Options (e.g. size, style)
                      </p>
                      <button
                        type="button"
                        onClick={() => addOption(color.key)}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {color.options.map((option) => (
                        <div
                          key={option.key}
                          className="rounded-xl p-3"
                          style={{ backgroundColor: "#EFE3C4" }}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <input
                              value={option.name}
                              onChange={(e) =>
                                updateOption(color.key, option.key, { name: e.target.value })
                              }
                              placeholder="Option name (e.g. Small)"
                              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                            />
                            <input
                              value={option.price}
                              onChange={(e) =>
                                updateOption(color.key, option.key, { price: e.target.value })
                              }
                              placeholder="Price (optional)"
                              inputMode="numeric"
                              className="w-28 rounded-lg px-3 py-2 text-sm outline-none"
                              style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(color.key, option.key)}
                              className="flex-shrink-0 text-xs font-semibold underline"
                              style={{ color: "#DE4B33" }}
                            >
                              remove
                            </button>
                          </div>

                          <ImageSlotPicker
                            files={option.imageFiles}
                            onChange={(files) =>
                              updateOption(color.key, option.key, { imageFiles: files })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {colors.length === 0 && (
                <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
                  No colors added yet.
                </p>
              )}
            </div>
          </div>
        )}
        <OptionGroupsEditor groups={optionGroups} onChange={setOptionGroups} />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-wide"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </div>
  );
}