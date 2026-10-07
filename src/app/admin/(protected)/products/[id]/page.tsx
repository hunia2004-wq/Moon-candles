"use client";

import { useEffect, useState } from "react";
import { logAdminActivity, diffFields, sameJson } from "@/lib/logAdminActivity";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";
import OptionGroupsEditor, {
  draftsFromGroups,
  groupsFromDrafts,
  type OptionGroupDraft,
} from "../../components/OptionGroupsEditor";
type ImageItem = { kind: "existing"; url: string } | { kind: "new"; file: File };

type OptionDraft = {
  key: string;
  name: string;
  price: string;
  images: ImageItem[];
};

type ColorDraft = {
  key: string;
  name: string;
  hex: string;
  price: string;
  images: ImageItem[];
  options: OptionDraft[];
};

function makeKey() {
  return Math.random().toString(36).slice(2);
}
// Rustic Warmth has no real colors — its two "color" entries exist
// purely to hold the Scented vs Unscented photo pair. Force the name
// to exactly one of those two values instead of free text.
const SCENT_ONLY_PRODUCTS = ["Rustic Warmth"];

// Pocket Hearts and Forever Clasp have real, named colors — but each
// color can independently be Scented or Unscented, stored as that
// color's OPTIONS (reusing the same mechanism Plain Candle uses for
// its size options). Force each option's name to one of those two
// values for these two products specifically.
const COLOR_SCENT_OPTION_PRODUCTS = ["Pocket Hearts", "Forever Clasp"];
function imagesFromColorOrOption(entry: { image_url?: string; image_urls?: string[] }): ImageItem[] {
  const urls = entry.image_urls?.length ? entry.image_urls : entry.image_url ? [entry.image_url] : [];
  return urls.map((url) => ({ kind: "existing", url }));
}

function ImageSlotPicker({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img, index) => (
        <div
          key={index}
          className="relative h-16 w-16 overflow-hidden rounded-lg"
          style={{ border: "1px solid rgba(0,0,0,0.15)" }}
        >
          <img
            src={img.kind === "existing" ? img.url : URL.createObjectURL(img.file)}
            alt=""
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(images.filter((_, i) => i !== index))}
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
            const newFiles = Array.from(e.target.files ?? []).map(
              (file): ImageItem => ({ kind: "new", file })
            );
            onChange([...images, ...newFiles]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sizeMl, setSizeMl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [category, setCategory] = useState<"candle" | "giveaway">("candle");
    const [optionGroups, setOptionGroups] = useState<OptionGroupDraft[]>([]);
      const [showOrderCounter, setShowOrderCounter] = useState(false);
   const isScentOnlyProduct = SCENT_ONLY_PRODUCTS.some(
    (n) => n.toLowerCase() === name.trim().toLowerCase()
  );

  const isColorScentOptionProduct = COLOR_SCENT_OPTION_PRODUCTS.some(
    (n) => n.toLowerCase() === name.trim().toLowerCase()
  );

  const [scents, setScents] = useState<string[]>([]);
  const [scentInput, setScentInput] = useState("");
  const [existingScents, setExistingScents] = useState<string[]>([]);

  const [hasColors, setHasColors] = useState(false);
  const [plainImages, setPlainImages] = useState<ImageItem[]>([]);
  const [colors, setColors] = useState<ColorDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [original, setOriginal] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: product, error: fetchError }, { data: allProducts }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).maybeSingle(),
        supabase.from("products").select("scents"),
      ]);

      const allScents = new Set<string>();
      (allProducts ?? []).forEach((row) => {
        (row.scents ?? []).forEach((s: string) => allScents.add(s));
      });
      setExistingScents(Array.from(allScents).sort());

      if (fetchError || !product) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const p = product as Product;

      setName(p.name ?? "");
      setDescription(p.description ?? "");
      setOriginal(p);
      setPrice(String(p.price ?? ""));
      setSizeMl(p.size_ml != null ? String(p.size_ml) : "");
      setIsFeatured(!!p.is_featured);
      setCategory((p.category as "candle" | "giveaway") ?? "candle");
      setScents(p.scents ?? []);
      setOptionGroups(draftsFromGroups(p.option_groups));
            setShowOrderCounter(!!p.show_order_counter);
      const productHasColors = (p.colors?.length ?? 0) > 0;
      setHasColors(productHasColors);

           if (productHasColors) {
        const loadedColors = (p.colors ?? []).map((c) => ({
          key: makeKey(),
          name: c.name ?? "",
          hex: c.hex ?? "#CCCCCC",
          price: c.price != null ? String(c.price) : "",
          images: imagesFromColorOrOption(c),
          options: (c.options ?? []).map((o) => ({
            key: makeKey(),
            name: o.name ?? "",
            price: o.price != null ? String(o.price) : "",
            images: imagesFromColorOrOption(o),
          })),
        }));

        setColors(loadedColors);

        // Pre-fill the top-level bulk price fields with the first
        // color's price for each option name, so the field shows the
        // real current value instead of starting blank.
        const initialBulkPrices: Record<string, string> = {};
        loadedColors.forEach((color) => {
          color.options.forEach((option) => {
            const key = option.name.trim();
            if (key && !(key in initialBulkPrices)) {
              initialBulkPrices[key] = option.price;
            }
          });
        });
        setBulkOptionPrices(initialBulkPrices);
      } else {
        setPlainImages((p.image_urls ?? []).map((url) => ({ kind: "existing", url })));
      }

      setLoading(false);
    }

    load();
  }, [productId]);

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

    const [bulkOptionPrices, setBulkOptionPrices] = useState<Record<string, string>>({});

  // Every distinct option name currently used across all colors (e.g.
  // "Unscented", "Scented"), so the bulk-price panel always reflects
  // whatever's actually in this product right now.
  const distinctOptionNames = Array.from(
    new Set(
      colors.flatMap((c) => c.options.map((o) => o.name.trim()).filter(Boolean))
    )
  );

    function updateOptionPriceForAllColors(optionName: string, value: string) {
    setBulkOptionPrices((prev) => ({ ...prev, [optionName]: value }));

    if (value === "" || !isNaN(Number(value))) {
      setColors((prev) =>
        prev.map((color) => ({
          ...color,
          options: color.options.map((option) =>
            option.name.trim().toLowerCase() === optionName.trim().toLowerCase()
              ? { ...option, price: value }
              : option
          ),
        }))
      );
    }
  }


  function addColor() {
    setColors([...colors, { key: makeKey(), name: "", hex: "#CCCCCC", price: "", images: [], options: [] }]);
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
          ? { ...c, options: [...c.options, { key: makeKey(), name: "", price: "", images: [] }] }
          : c
      )
    );
  }

  function updateOption(colorKey: string, optionKey: string, patch: Partial<OptionDraft>) {
    setColors(
      colors.map((c) =>
        c.key === colorKey
          ? { ...c, options: c.options.map((o) => (o.key === optionKey ? { ...o, ...patch } : o)) }
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

  async function resolveImages(images: ImageItem[]): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];

    for (const img of images) {
      if (img.kind === "existing") {
        urls.push(img.url);
        continue;
      }

      const path = `admin-uploads/${Date.now()}-${makeKey()}-${img.file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, img.file);

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
          const colorImageUrls = await resolveImages(color.images);

          const optionsPayload = [];
          for (const option of color.options) {
            const optionImageUrls = await resolveImages(option.images);
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
        imageUrls = await resolveImages(plainImages);
      }

      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("products")
        .update({
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
        })
        .eq("id", productId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Activity log
      if (original) {
        const label = name.trim();
        const oldPrice = Number(original.price);
        const newPrice = Number(price);
        if (oldPrice !== newPrice) {
          logAdminActivity({
            action: "product.price_changed",
            entityType: "product",
            entityId: String(productId),
            entityLabel: label,
            details: { from: oldPrice, to: newPrice },
          });
        }
        const changes = diffFields(
          {
            name: original.name,
            category: original.category,
            description: original.description ?? null,
            size_ml: original.size_ml ?? null,
            is_featured: !!original.is_featured,
            scents: original.scents ?? [],
            show_order_counter: !!original.show_order_counter,
          },
          {
            name: name.trim(),
            category,
            description: description.trim() || null,
            size_ml: sizeMl ? Number(sizeMl) : null,
            is_featured: isFeatured,
            scents,
            show_order_counter: showOrderCounter,
          }
        );
        if (!sameJson(original.colors ?? [], colorsPayload)) changes.colors = { from: "previous", to: "updated" };
        if (!sameJson(original.image_urls ?? [], imageUrls)) changes.images = { from: "previous", to: "updated" };
        if (!sameJson(original.option_groups ?? [], groupsFromDrafts(optionGroups))) changes.option_groups = { from: "previous", to: "updated" };
        if (Object.keys(changes).length) {
          logAdminActivity({
            action: "product.updated",
            entityType: "product",
            entityId: String(productId),
            entityLabel: label,
            details: { changes },
          });
        }
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    logAdminActivity({
      action: "product.deleted",
      entityType: "product",
      entityId: String(productId),
      entityLabel: original?.name ?? name,
      details: { snapshot: original ?? null },
    });

    router.push("/admin/products");
  }

  if (loading) {
    return <p style={{ color: "#000000" }}>Loading...</p>;
  }

  if (notFound) {
    return <p style={{ color: "#DE4B33" }}>Product not found.</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#000000" }}>
          Edit Product
        </h1>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold underline"
          style={{ color: "#DE4B33" }}
        >
          {deleting ? "Deleting..." : "Delete Product"}
        </button>
      </div>

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

               <div className="flex flex-wrap gap-4">
          {hasColors && distinctOptionNames.length > 0 ? (
            distinctOptionNames.map((optionName) => (
              <div key={optionName} className="flex-1" style={{ minWidth: "120px" }}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.6)" }}>
                  {optionName} Price (EGP)
                </label>
                <input
                  value={bulkOptionPrices[optionName] ?? ""}
                  onChange={(e) => updateOptionPriceForAllColors(optionName, e.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                />
              </div>
            ))
          ) : (
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
          )}

          <div className="flex-1" style={{ minWidth: "120px" }}>
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
              <label className="flex items-center gap-3 pb-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
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
              onClick={() => {
                if (!hasColors && plainImages.length > 0) {
                  const confirmed = window.confirm(
                    "This product has photos that aren't attached to any color. Switching to colors means those photos won't be saved unless you add them to a color yourself. Continue?"
                  );
                  if (!confirmed) return;
                }
                setHasColors(true);
              }}
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
            <ImageSlotPicker images={plainImages} onChange={setPlainImages} />
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
                >                  <div className="mb-3 flex items-center gap-3">
                    {!isScentOnlyProduct && (
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => updateColor(color.key, { hex: e.target.value })}
                        className="h-9 w-9 flex-shrink-0 rounded-lg border-0"
                      />
                    )}

                    {isScentOnlyProduct ? (
                      <div className="flex flex-1 gap-2">
                        {(["Unscented", "Scented"] as const).map((label) => {
                          const selected = color.name.trim().toLowerCase() === label.toLowerCase();
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => updateColor(color.key, { name: label })}
                              className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                              style={{
                                backgroundColor: selected ? "#DE4B33" : "#FFFFFF",
                                color: selected ? "#FFF4E6" : "#000000",
                                borderColor: selected ? "#DE4B33" : "rgba(0,0,0,0.15)",
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        value={color.name}
                        onChange={(e) => updateColor(color.key, { name: e.target.value })}
                        placeholder="Color name (e.g. White)"
                        className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                      />
                    )}

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

                  {isScentOnlyProduct && color.name.trim().toLowerCase() === "scented" && (
                    <div
                      className="mb-3 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: "#EFE3C4" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.55)" }}>
                        Scent{scents.length !== 1 ? "s" : ""} for this variant
                      </p>
                      {scents.length > 0 ? (
                        <p className="mt-1 text-sm font-semibold" style={{ color: "#000000" }}>
                          {scents.join(", ")}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: "#DE4B33" }}>
                          No scents selected yet — choose them in the Scents section below.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.5)" }}>
                      Photos for this color
                    </p>
                    <ImageSlotPicker
                      images={color.images}
                      onChange={(images) => updateColor(color.key, { images })}
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
                        <div key={option.key} className="rounded-xl p-3" style={{ backgroundColor: "#EFE3C4" }}>
                          <div className="mb-2 flex items-center gap-2">
                            {isColorScentOptionProduct ? (
                              <div className="flex flex-1 gap-2">
                                {(["Unscented", "Scented"] as const).map((label) => {
                                  const selected = option.name.trim().toLowerCase() === label.toLowerCase();
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => updateOption(color.key, option.key, { name: label })}
                                      className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                                      style={{
                                        backgroundColor: selected ? "#DE4B33" : "#FFFFFF",
                                        color: selected ? "#FFF4E6" : "#000000",
                                        borderColor: selected ? "#DE4B33" : "rgba(0,0,0,0.15)",
                                      }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                value={option.name}
                                onChange={(e) => updateOption(color.key, option.key, { name: e.target.value })}
                                placeholder="Option name (e.g. Small)"
                                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                              />
                            )}
                            <input
                              value={option.price}
                              onChange={(e) => updateOption(color.key, option.key, { price: e.target.value })}
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

                          {isColorScentOptionProduct && option.name.trim().toLowerCase() === "scented" && (
                            <div
                              className="mb-2 rounded-lg px-3 py-2"
                              style={{ backgroundColor: "#FFFFFF" }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.55)" }}>
                                Scent{scents.length !== 1 ? "s" : ""}
                              </p>
                              {scents.length > 0 ? (
                                <p className="mt-0.5 text-sm font-semibold" style={{ color: "#000000" }}>
                                  {scents.join(", ")}
                                </p>
                              ) : (
                                <p className="mt-0.5 text-sm" style={{ color: "#DE4B33" }}>
                                  No scents selected yet — choose them in the Scents section below.
                                </p>
                              )}
                            </div>
                          )}

                          <ImageSlotPicker
                            images={option.images}
                            onChange={(images) => updateOption(color.key, option.key, { images })}
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}