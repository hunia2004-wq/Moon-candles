export type CustomerImage = {
  label: string;      // used only in the downloaded file name
  url: string;
  side?: "front" | "back";
  heading?: string;   // small text shown above the button
};

const CANDLE_FONT_NAMES: Record<string, string> = {
  elegant: "Elegant",
  flow: "Flow",
  classic: "Classic",
  hand: "Hand",
  soft: "Soft",
};

// "Text on candle" line for the admin pages.
export function candleTextNote(c: any): string {
  const text = c?.message ? `"${c.message}"` : "No text";
  const font = CANDLE_FONT_NAMES[c?.fontId] ?? c?.fontId;
  return `Text on candle: ${text}${font ? ` · Font: ${font}` : ""}`;
}

export function collectCustomerImages(item: any): CustomerImage[] {
  const out: CustomerImage[] = [];

  const add = (
    label: string,
    url: unknown,
    side?: "front" | "back",
    heading?: string
  ) => {
    if (typeof url === "string" && url.startsWith("http")) {
      out.push({ label, url, side, heading });
    }
  };

  const c = item?.customization;
  const isCandle = c?.type === "customized-candle";

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

  // Tambourine and older orders: not split by side.
  // Custom Candle: the finished sticker, listed first.
  add(
    isCandle ? "sticker" : "design",
    c?.renderedDesignUrl,
    undefined,
    isCandle ? "Sticker (print)" : undefined
  );
  if (Array.isArray(c?.layers)) {
    for (const l of c.layers) {
      if (l.type === "pattern") add("photo", l.src);
    }
  }

  // Other products
  const photoHeading =
    c?.type === "mini-candles"
      ? "Initials' image on candle"
      : isCandle
      ? "Image on candle"
      : undefined;

  add("photo", c?.photoUrl, undefined, photoHeading);
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