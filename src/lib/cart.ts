// Shared cart helpers.
// The cart lives in localStorage under the "cart" key.

import { createClient } from "@/lib/supabase/client";

export type TambourineCustomization = {
  type: "customized-tambourine";
  size: "small" | "large";
  sizeCm: 12 | 20;
  ribbonColor: string;
  layers: unknown[];
  renderedDesignUrl?: string;
};

export type FanCustomization = {
  type: "customized-fan";
  size: string;
  tasselLabel: string;
  tasselColor: string;
  layersBySide: unknown;
  renderedDesignUrls?: {
    front?: string;
    back?: string;
  };
};
export type MonogramCustomization = {
  type: "monogram";
  monogramText: string;
  monogramImage?: string;
};

export type CandleCustomization = {
  type: "customized-candle";
  size: "small" | "large";
  message: string;
  photoUrl: string | null;
  fontId: string;
  renderedDesignUrl?: string;   // ← add this
};
export type MiniCandlesCustomization = {
  type: "mini-candles";
  photoUrl: string;
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

  // The product's own category ("giveaway", "candle", "customizable",
  // etc.) copied straight from products.category at the moment this
  // item was added to the cart. Lets anything reading the cart later
  // (e.g. the admin Custom Orders list) classify an item without a
  // hardcoded name list — a newly added giveaway in the admin panel
  // works automatically, with zero code changes, as long as its
  // category is set correctly when it's created.
  category?: string | null;

  // Bloom Wand specific — its style ("With Photo", etc.) and, when
  // that style is chosen, the front/back photos the customer
  // uploaded. Optional so every other product's cart items
  // are unaffected.
  option?: string | null;
  photoUrlFront?: string | null;
  photoUrlBack?: string | null;

  // Optional customization information.
  // Can belong to either a customized tambourine or customized fan.
customization?:
  | TambourineCustomization
  | FanCustomization
  | MonogramCustomization
  | CandleCustomization
  | MiniCandlesCustomization;

  // The real `products.id` this cart item should be matched against
  // for promotions. Customized items (Fan, Tambourine, Mini Candles)
  // have a stable product-catalog row created just so promotions can
  // target them from the admin panel like any other product, even
  // though their price/customization is generated at add-to-cart
  // time rather than read straight from that row. Plain shop
  // products don't need this — their numeric `productId` already IS
  // the real id.
  productRefId?: number;
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
export function getMiniCandlesPhoto(item: CartItem): string | null {
  const c = item.customization;
  return c && c.type === "mini-candles" ? c.photoUrl : null;
}
// The pictures to show for a cart item. A customized tambourine or fan
// shows the design the customer built; anything else (or an item with no
// design picture) shows the plain product photo.
export function getCartItemThumbnails(item: CartItem): string[] {
  const c = item.customization;

  if (c?.type === "customized-tambourine" && c.renderedDesignUrl) {
    return [c.renderedDesignUrl];
  }

  if (c?.type === "customized-fan") {
    const pictures = [c.renderedDesignUrls?.front, c.renderedDesignUrls?.back].filter(
      (url): url is string => !!url
    );
    if (pictures.length > 0) return pictures;
  }

  return [item.image || ""];
}

function setCart(
  items: CartItem[],
  options?: { open?: boolean }
) {
  localStorage.setItem(
    "cart",
    JSON.stringify(items)
  );

  // "open" tells the drawer whether this write should pop it open.
  // Adding a new item should; a quantity tweak on an already-open
  // order list shouldn't.
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: {
        open: options?.open ?? false,
      },
    })
  );
}

export function addToCart(
  item: CartItem,
  options?: { open?: boolean }
) {
  const cart = getCart();
  const shouldOpen = options?.open ?? true;

  const existingIndex = cart.findIndex(
    (cartItem) =>
      cartItem.id === item.id
  );

  if (existingIndex !== -1) {
    const updatedCart = [...cart];

    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      quantity:
        updatedCart[existingIndex].quantity +
        item.quantity,
    };

    setCart(updatedCart, {
      open: shouldOpen,
    });

    return;
  }

  setCart(
    [...cart, item],
    {
      open: shouldOpen,
    }
  );
}

export function updateCartItemQuantity(
  id: string,
  quantity: number
) {
  const cart = getCart();

  if (quantity <= 0) {
    setCart(
      cart.filter(
        (item) => item.id !== id
      )
    );

    return;
  }

  setCart(
    cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity,
          }
        : item
    )
  );
}

export function removeCartItem(
  id: string
) {
  setCart(
    getCart().filter(
      (item) => item.id !== id
    )
  );
}

export function clearCart() {
  setCart([]);
}

export function cartTotal(
  items: CartItem[]
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );
}

export function cartCount(
  items: CartItem[]
): number {
  return items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );
}

/* ------------------------------------------------------------------ */
/* PROMOTION DISCOUNTS                                                */
/* ------------------------------------------------------------------ */

type ActiveDiscount = {
  type: string;
  value: number;
};

let discountCache: Record<number, ActiveDiscount> | null = null;
let discountCachePromise: Promise<Record<number, ActiveDiscount>> | null = null;

/**
 * Fetches every active percentage/fixed promotion, keyed by the real
 * products.id it applies to. Used by anything that needs to price a
 * cart item against current promotions — plain shop products and
 * customized items alike, since customized items now carry a real
 * productRefId pointing at their own catalog row. Cached per page
 * load; call clearDiscountCache() if you need a fresh read sooner
 * (e.g. right after visiting a page that might have changed).
 */
async function loadDiscountMap(): Promise<Record<number, ActiveDiscount>> {
  if (discountCache) return discountCache;
  if (discountCachePromise) return discountCachePromise;

  discountCachePromise = (async () => {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id, promotions(discount_type, discount_value, is_active, starts_at, ends_at)");

    const map: Record<number, ActiveDiscount> = {};

    if (!error && data) {
      for (const row of data as any[]) {
        const promo = row.promotions;
        if (!promo || !promo.is_active) continue;
        if (promo.starts_at && promo.starts_at > nowIso) continue;
        if (promo.ends_at && promo.ends_at < nowIso) continue;
        if (promo.discount_type !== "percentage" && promo.discount_type !== "fixed") continue;

        map[row.product_id] = {
          type: promo.discount_type,
          value: promo.discount_value,
        };
      }
    }

    discountCache = map;
    return map;
  })();

  return discountCachePromise;
}

export function clearDiscountCache() {
  discountCache = null;
  discountCachePromise = null;
}

/**
 * Returns the discounted unit price for a cart item, or its plain
 * price if no active promotion applies. Matches against
 * item.productRefId when present (customized items), falling back to
 * item.productId when it's already numeric (plain shop products).
 */
export async function getDiscountedPrice(item: CartItem): Promise<number> {
  const refId =
    item.productRefId ??
    (typeof item.productId === "number" ? item.productId : null);

  if (refId == null) return item.price;

  const map = await loadDiscountMap();
  const discount = map[refId];
  if (!discount) return item.price;

  if (discount.type === "percentage") {
    return Math.round(item.price * (1 - discount.value / 100));
  }
  if (discount.type === "fixed") {
    return Math.max(0, item.price - discount.value);
  }
  return item.price;
}

/**
 * Cart total with active promotions applied per line. Use this
 * instead of cartTotal() wherever the customer-facing total should
 * reflect discounts (cart drawer, checkout). cartTotal() itself stays
 * as a plain sum, since some callers (e.g. an admin view) may want
 * the undiscounted figure.
 */
export async function cartTotalWithDiscounts(items: CartItem[]): Promise<number> {
  const prices = await Promise.all(items.map((item) => getDiscountedPrice(item)));
  return items.reduce((sum, item, i) => sum + prices[i] * item.quantity, 0);
}