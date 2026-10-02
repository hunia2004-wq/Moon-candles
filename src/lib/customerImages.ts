export type CustomerImage = { label: string; url: string };

export function collectCustomerImages(item: any): CustomerImage[] {
  const out: CustomerImage[] = [];
  const add = (label: string, url: unknown) => {
    if (typeof url === "string" && url.startsWith("http")) out.push({ label, url });
  };

  const c = item?.customization;

  // Fan: pattern layers on the front and back
  if (c?.layersBySide) {
    for (const side of ["front", "back"] as const) {
      for (const l of c.layersBySide[side] ?? []) {
        if (l.type === "pattern") add(side, l.src);
      }
    }
  }

  // Tambourine: pattern layers
  if (Array.isArray(c?.layers)) {
    for (const l of c.layers) {
      if (l.type === "pattern") add("design", l.src);
    }
  }

  // Other products
  add("photo", c?.photoUrl);
  add("lettering", c?.monogramImage);
  add("front", item?.photoUrlFront);
  add("back", item?.photoUrlBack);

  return out;
}

// Supabase serves a file as a download (with this file name) when the URL has ?download=
export function downloadUrl(url: string, baseName: string) {
  const ext = url.split("?")[0].split(".").pop() || "png";
  const safe = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-");
  return `${url}?download=${encodeURIComponent(`${safe}.${ext}`)}`;
}