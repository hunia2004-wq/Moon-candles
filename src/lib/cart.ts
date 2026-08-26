// Shared cart helpers.
// The cart lives in localStorage under the "cart" key.

export type TambourineCustomization = {
  type: "customized-tambourine";
  size: "small" | "large";
  sizeCm: 12 | 20;
  ribbonColor: string;
  layers: unknown[];
};

export type CartItem = {
  id: string;
  productId: string | number;
  productName: string;
  price: number;
  quantity: number;
  scent: string | null;
  color: string | null;
  image: string;

  // Optional customization information.
  // Existing products do not need to have this.
  customization?: TambourineCustomization;
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

  window.dispatchEvent(new Event("cartUpdated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();

  const existingIndex = cart.findIndex((cartItem) => cartItem.id === item.id);

  if (existingIndex !== -1) {
    const updatedCart = [...cart];

    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      quantity: updatedCart[existingIndex].quantity + item.quantity,
    };

    setCart(updatedCart);
    return;
  }

  setCart([...cart, item]);
}

export function updateCartItemQuantity(id: string, quantity: number) {
  const cart = getCart();

  if (quantity <= 0) {
    setCart(cart.filter((item) => item.id !== id));
    return;
  }

  setCart(
    cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
  );
}

export function removeCartItem(id: string) {
  setCart(getCart().filter((item) => item.id !== id));
}

export function clearCart() {
  setCart([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
}

export function cartCount(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
}