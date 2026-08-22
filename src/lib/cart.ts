// Shared cart helpers. The cart lives in localStorage under the "cart" key
// as an array of CartItem — this is the exact shape ProductDetailView.tsx
// already writes (id, productId, productName, price, quantity, scent,
// color, image), so this file doesn't change your existing data, it just
// gives every page one place to read/write it instead of each page
// re-implementing JSON.parse/localStorage.setItem/dispatchEvent separately.

export type CartItem = {
  id: string;
  productId: string | number;
  productName: string;
  price: number;
  quantity: number;
  scent: string | null;
  color: string | null;
  image: string;
};

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
  // Same event your product pages already dispatch — anything listening
  // for "cartUpdated" (e.g. a cart icon badge in the header) keeps working
  // unchanged.
  window.dispatchEvent(new Event("cartUpdated"));
}

export function updateCartItemQuantity(id: string, quantity: number) {
  const cart = getCart();
  if (quantity <= 0) {
    setCart(cart.filter((item) => item.id !== id));
    return;
  }
  setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
}

export function removeCartItem(id: string) {
  setCart(getCart().filter((item) => item.id !== id));
}

export function clearCart() {
  setCart([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}