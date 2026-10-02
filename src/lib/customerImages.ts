export type CustomerImage = {
  label: string;
  url: string;
  side?: "front" | "back";
};

export function collectCustomerImages(item: any): CustomerImage[] {
  const out: CustomerImage[] = [];

  const add = (label: string, url: unknown, side?: "front" | "back") => {
    if (typeof url === "string" && url.startsWith("http")) {
      out.push({ label, url, side });
    }
  };

  const c = item?.customization;

  // Fan: the finished design picture and any uploaded photo, per side
  add("design", c?.renderedDesignUrls?.front, "front");
  add("design", c?.renderedDesignUrls?.back, "back");

  if (c?.layersBySide) {
    for (const side of ["front", "back"] as const) {
      for (const l of c.layersBySide[side] ?? []) {
        if (l.type === "pattern") add("photo", l.src, side);
      }
    }
  }

  // Tambourine and older orders: not split by side
  add("design", c?.renderedDesignUrl);
  if (Array.isArray(c?.layers)) {
    for (const l of c.layers) {
      if (l.type === "pattern") add("photo", l.src);
    }
  }

  // Other products
  add("photo", c?.photoUrl);
  add("lettering", c?.monogramImage);
  add("photo", item?.photoUrlFront, "front");
  add("photo", item?.photoUrlBack, "back");

  return out;
}

// Supabase serves a file as a download (with this file name) when the URL has ?download=
export function downloadUrl(url: string, baseName: string) {
  const ext = url.split("?")[0].split(".").pop() || "png";
  const safe = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-");
  return `${url}?download=${encodeURIComponent(`${safe}.${ext}`)}`;
}