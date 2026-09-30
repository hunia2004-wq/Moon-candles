import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";

export type AppliedPromotion = {
  id: string;
  title: string;
  discountType: string;
};

export type PromotionResult = {
  discountAmount: number;
  freeGiftEligible: boolean;
  applied: AppliedPromotion[];
};

const EMPTY_RESULT: PromotionResult = { discountAmount: 0, freeGiftEligible: false, applied: [] };

// Expands cart items into one "unit" per quantity, so per-item discount
// types (bogo, bundles, tiers) can pair/group individual units rather
// than whole cart lines. productId is normalized to a number here since
// CartItem.productId can be string | number but Supabase ids are numeric.
function expandUnits(items: CartItem[]) {
  const units: { productId: number; price: number }[] = [];
  for (const item of items) {
    const productId = item.productRefId ?? Number(item.productId);
    for (let i = 0; i < item.quantity; i++) {
      units.push({ productId, price: item.price });
    }
  }
  return units;
}

export async function computeCartPromotions(items: CartItem[]): Promise<PromotionResult> {
  if (items.length === 0) return EMPTY_RESULT;

  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const { data: promos, error: promosError } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .neq("discount_type", "free_shipping") // handled separately in checkout
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`);

  if (promosError || !promos || promos.length === 0) return EMPTY_RESULT;

  const { data: links } = await supabase
    .from("promotion_products")
    .select("promotion_id, product_id")
    .in("promotion_id", promos.map((p) => p.id));

  const linksByPromo: Record<string, number[]> = {};
  (links ?? []).forEach((row: any) => {
    if (!linksByPromo[row.promotion_id]) linksByPromo[row.promotion_id] = [];
    linksByPromo[row.promotion_id].push(Number(row.product_id));
  });

  const allUnits = expandUnits(items);
  const cartSubtotal = allUnits.reduce((sum, u) => sum + u.price, 0);

  let totalDiscount = 0;
  let freeGiftEligible = false;
  const applied: AppliedPromotion[] = [];

  for (const promo of promos) {
    const productIds = linksByPromo[promo.id]; // undefined/empty = store-wide
    const isStoreWide = !productIds || productIds.length === 0;
    const matchingUnits = isStoreWide ? allUnits : allUnits.filter((u) => productIds.includes(u.productId));

    if (matchingUnits.length === 0 && promo.discount_type !== "free_gift") continue;

    const matchingSubtotal = matchingUnits.reduce((sum, u) => sum + u.price, 0);
    let promoDiscount = 0;

    switch (promo.discount_type) {
      case "percentage": {
        if (promo.discount_value) promoDiscount = matchingSubtotal * (promo.discount_value / 100);
        break;
      }

      case "fixed": {
        if (promo.discount_value) promoDiscount = Math.min(promo.discount_value, matchingSubtotal);
        break;
      }

      case "bogo": {
        // Pair units by price, high to low; the second (cheaper) of each pair is free.
        const sorted = [...matchingUnits].sort((a, b) => b.price - a.price);
        for (let i = 1; i < sorted.length; i += 2) promoDiscount += sorted[i].price;
        break;
      }

      case "second_item_percent_off": {
        if (promo.discount_value) {
          const sorted = [...matchingUnits].sort((a, b) => b.price - a.price);
          for (let i = 1; i < sorted.length; i += 2) {
            promoDiscount += sorted[i].price * (promo.discount_value / 100);
          }
        }
        break;
      }
            case "buy_x_get_y_free": {
        // Buy N, get 1 free: for every group of (buy_qty + 1) matching
        // units, the cheapest one in that group is free. buy_qty comes
        // from tiered_min_qty (reused here as "how many you must buy").
        if (promo.tiered_min_qty && promo.tiered_min_qty > 0) {
          const groupSize = promo.tiered_min_qty + 1;
          const sorted = [...matchingUnits].sort((a, b) => b.price - a.price);
          for (let i = groupSize - 1; i < sorted.length; i += groupSize) {
            promoDiscount += sorted[i].price;
          }
        }
        break;
      }

      case "min_spend_percent_off": {
        if (promo.discount_value && promo.min_spend_amount && cartSubtotal >= promo.min_spend_amount) {
          promoDiscount = matchingSubtotal * (promo.discount_value / 100);
        }
        break;
      }

   case "bundle_price": {
  if (promo.bundle_quantity && promo.bundle_price != null) {
    if (promo.bundle_same_product_only) {
      // Requires N units of the SAME product — grouped per productId.
      const byProduct = new Map<number, { productId: number; price: number }[]>();
      for (const unit of matchingUnits) {
        const arr = byProduct.get(unit.productId) ?? [];
        arr.push(unit);
        byProduct.set(unit.productId, arr);
      }

      for (const units of byProduct.values()) {
        const sorted = [...units].sort((a, b) => b.price - a.price);
        for (let i = 0; i + promo.bundle_quantity <= sorted.length; i += promo.bundle_quantity) {
          const chunk = sorted.slice(i, i + promo.bundle_quantity);
          const chunkSum = chunk.reduce((s, u) => s + u.price, 0);
          const saved = chunkSum - promo.bundle_price;
          if (saved > 0) promoDiscount += saved;
        }
      }
    } else {
      // Any mix of the promo's matching products can fill a bundle.
      const sorted = [...matchingUnits].sort((a, b) => b.price - a.price);
      for (let i = 0; i + promo.bundle_quantity <= sorted.length; i += promo.bundle_quantity) {
        const chunk = sorted.slice(i, i + promo.bundle_quantity);
        const chunkSum = chunk.reduce((s, u) => s + u.price, 0);
        const saved = chunkSum - promo.bundle_price;
        if (saved > 0) promoDiscount += saved;
      }
    }
  }
  break;
}

      case "tiered_quantity_percent_off": {
  if (promo.discount_value && promo.tiered_min_qty) {
    const groupSize = promo.tiered_min_qty;
    const sorted = [...matchingUnits].sort((a, b) => b.price - a.price);
    const fullGroups = Math.floor(sorted.length / groupSize);
    const discountedCount = fullGroups * groupSize;
    for (let i = 0; i < discountedCount; i++) {
      promoDiscount += sorted[i].price * (promo.discount_value / 100);
    }
  }
  break;
}

            case "free_gift": {
        if (promo.min_spend_amount && cartSubtotal >= promo.min_spend_amount) {
          freeGiftEligible = true;
        }
        break;
      }

      default:
        break;
    }

    if (promoDiscount > 0) {
      totalDiscount += promoDiscount;
      applied.push({ id: promo.id, title: promo.title, discountType: promo.discount_type });
    }
  }

  totalDiscount = Math.min(totalDiscount, cartSubtotal);

    return { discountAmount: Math.round(totalDiscount * 100) / 100, freeGiftEligible, applied };
}