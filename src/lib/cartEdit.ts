import { getCart, type CartItem } from "@/lib/cart";

// Where to send the customer to edit a cart item. Returns null for items
// that can't be edited, so the edit link simply doesn't show.
export function editHref(item: CartItem): string | null {
  const type = (item as any).customization?.type;
  const id = encodeURIComponent(item.id);

  if (type === "customized-candle") return `/customize?edit=${id}`;
  if (type === "customized-fan") return `/customize/fan?edit=${id}`;
  if (type === "customized-tambourine") return `/customize/tambourine?edit=${id}`;
  if (item.productId === "mini-candles") return "/customize-mini";

  return null;
}

// Swaps one cart line for an updated version, keeping its position.
export function replaceCartItem(id: string, next: object) {
  const updated = getCart().map((item) => (item.id === id ? next : item));
  localStorage.setItem("cart", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { open: false } }));
}