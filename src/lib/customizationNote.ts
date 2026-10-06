import { candleTextNote } from "@/lib/customerImages";

export function customizationNote(item: any): string | null {
  const c = item?.customization;
  if (!c) return null;

  if (c.type === "monogram") {
    if (c.monogramText) return `Initials: "${c.monogramText}"`;
    if (c.monogramImage) return "Custom uploaded lettering";
    return null;
  }

  if (c.type === "customized-tambourine") {
    return c.ribbonColor ? `Ribbon: ${c.ribbonColor}` : null;
  }

  if (c.type === "customized-fan") {
    return c.tasselColor ? `Tassel: ${c.tasselColor}` : null;
  }

  if (c.type === "customized-candle") {
    return candleTextNote(c);
  }

  return null;
}