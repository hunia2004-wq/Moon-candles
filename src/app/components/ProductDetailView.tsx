"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { addToCart, updateCartItemQuantity, removeCartItem, getCart } from "@/lib/cart";
type OrderLine = {
  id: string;
  colorName: string;
  scentName: string | null;
  price: number;
  quantity: number;
  image: string;
  inCart?: boolean;
  monogramText?: string;
  monogramImage?: string;
};

type GalleryItem = {
  url: string;
  colorName: string | null;
  colorIndex: number;
};
const GIVEAWAY_NAMES = [
  "Mini Candles",
  "Quack and Kiss",
  "Tambourine",
  "Fan",
  "Bloom Wand",
  "Forever Clasp",
  "Pocket Hearts",
  "Rustic Warmth",
];

const CUSTOMIZE_ROUTES: Record<string, string> = {
  Tambourine: "/customize/tambourine",
  Fan: "/customize/fan",
  "Mini Candles": "/customize-mini",
};

const CUSTOMIZE_ONLY_NAMES = [
  "Fan",
  "Mini Candles",
];


const QUACK_AND_KISS_NAMES = [
  "Quack and Kiss",
];

const TWO_COLOR_PRODUCTS = [
  "Noor Al Qamar",
  "Noor El Kamar",
];
// Tambourine: is a giveaway AND sells plain, needs the normal Add to
// Cart button (unlike Fan/Mini Candles, which are customize-only). It
// also should NOT combine both sizes' photos into one shared gallery —
// each size's gallery should show only that size's own photos.
const PLAIN_SELLABLE_GIVEAWAY_NAMES = ["Tambourine", "Forever Clasp", "Pocket Hearts", "Rustic Warmth"];
// These three don't have real colors — their two "color" entries are
// actually a Scented/Unscented photo pair, same pattern as Molten
// Muse's single-variant styling. Label the picker "Scent" instead of
// "Color" so it reads correctly, as long as the admin panel names
// the two variants "Scented" and "Unscented".
const SCENT_VARIANT_PRODUCTS = ["Rustic Warmth"];
/*
 * ============================================================
 * PRODUCTS WHOSE COLORS SHOULD BE SWIPED IN THE GALLERY
 * ============================================================
 *
 * These products have one/more images per color, and the
 * horizontal gallery should move through the COLORS themselves.
 */
const COLOR_SCROLL_PRODUCTS = [
  "Marble Moon",
  "Dimple Moon",
  "Iced Latte",
  "Forever Clasp",
  "Pocket Hearts",
  "Rustic Warmth",
  "Jar Candle",
  "Bloom Wand",
];

// These simple, single-variant candles skip the on-page "Your Order"
// counter entirely — Add to Cart just adds one each click, and
// quantity is only adjusted from the cart drawer/page from here on.
const NO_ORDER_COUNTER_NAMES = [
  "Marble Moon",
  "Dimple",
  "Iced Latte",
  "Molten Muse",
  "Crystal Glow",
  "Ocean Seashell Candle",
  "Melt Balm",
  "Forever Clasp",
  "Pocket Hearts",
  "Rustic Warmth",
  "Jar Candle",
  "plain candle",
];
const NO_GALLERY_ARROWS_NAMES = ["Plain Candle"];
const RIBBON_COLORS = [
  { id: "light-pink", label: "Light Pink", hex: "#F5C6D6" },
  { id: "light-blue", label: "Light Blue", hex: "#B9D9EC" },
  { id: "navy", label: "Navy", hex: "#22345C" },
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "red", label: "Red", hex: "#C0392B" },
  { id: "beige", label: "Beige", hex: "#E8DCC4" },
  { id: "maroon", label: "Maroon", hex: "#6B1F2A" },
  { id: "gold", label: "Glittery Gold", hex: "#D4AF37" },
  { id: "olive", label: "Olive", hex: "#6E6E36" },
  { id: "light-purple", label: "Light Purple", hex: "#C9B6E4" },
  { id: "dark-purple", label: "Dark Purple", hex: "#4B2E6F" },
] as const;


type RibbonColorId = (typeof RIBBON_COLORS)[number]["id"];

const QUACK_IMAGES = {
  combo:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/bride%20and%20groom%20duck.png",

  bride:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/bride%20duck.png",

  groom:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/groom%20duck.png",
};


export default function ProductDetailView({
  product,
  isMenuOpen = false,
}: {
  product: Product;
  isMenuOpen?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  /*
   * ============================================================
   * PRODUCT NAME
   * ============================================================
   */

  const rawProduct = product as Product & {
    name?: string | null;
    product_name?: string | null;
    title?: string | null;
    display_name?: string | null;
  };

  const productName =
    typeof rawProduct.name === "string" &&
    rawProduct.name.trim()
      ? rawProduct.name.trim()
      : typeof rawProduct.product_name === "string" &&
        rawProduct.product_name.trim()
      ? rawProduct.product_name.trim()
      : typeof rawProduct.title === "string" &&
        rawProduct.title.trim()
      ? rawProduct.title.trim()
      : typeof rawProduct.display_name === "string" &&
        rawProduct.display_name.trim()
      ? rawProduct.display_name.trim()
      : "Product";

  const normalizedProductName =
    productName.trim().toLowerCase();
      // Some products' photos sit small/centered within their own image
  // file (e.g. Molten Muse's glass is a small part of the frame) —
  // this trims the gallery slide's own padding for just those
  // products so the photo can visually fill more of the box, without
  // touching every other product's gallery.
  const GALLERY_SLIDE_PADDING_OVERRIDES: Record<string, string> = {
       "molten muse": "px-0 py-0 md:px-1",
  };
  // Per-product, per-image-index scale overrides. Index is the
  // position in that product's own gallery (0 = first image, 1 =
  // second, etc.) — omit an index to leave that image at its
  // default (unscaled) size.
 type GalleryScaleMap = Record<string, Record<number, number>>;

  const GALLERY_IMAGE_SCALE_OVERRIDES: GalleryScaleMap = {
    "molten muse": {
      0: 1.9, // image 1
      2: 1.7, // image 3
      // no entry for index 1 (image 2) — stays default size
    },
  };

  function getGalleryImageScale(index: number): number {
    return (
      GALLERY_IMAGE_SCALE_OVERRIDES[normalizedProductName]?.[index] ?? 1
    );
  }

  // Per-product, per-image-index vertical nudge, in pixels. Negative
  // moves the image UP, positive moves it DOWN. Same index rules as
  // the scale map above — omit an index to leave it unmoved.
  type GalleryOffsetMap = Record<string, Record<number, number>>;

  const GALLERY_IMAGE_OFFSET_Y_OVERRIDES: GalleryOffsetMap = {
    "molten muse": {
      2: -40, // image 3 — nudged upward
    },
  };

  function getGalleryImageOffsetY(index: number): number {
    return (
      GALLERY_IMAGE_OFFSET_Y_OVERRIDES[normalizedProductName]?.[index] ?? 0
    );
  }

  const gallerySlidePadding =
    GALLERY_SLIDE_PADDING_OVERRIDES[normalizedProductName] ??
    "px-4 py-2 md:px-8";

  /*
   * ============================================================
   * SPECIAL PRODUCT TYPES
   * ============================================================
   */

  const preselectedColor =
    searchParams.get("color");

  const isGiveaway =
    GIVEAWAY_NAMES.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );

  const isQuackAndKiss =
    QUACK_AND_KISS_NAMES.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );

  const isTwoColorProduct =
    TWO_COLOR_PRODUCTS.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );

  /*
   * THIS IS THE IMPORTANT PART
   *
   * Marble, Dimple and Iced Latte are treated as a single
   * horizontally scrollable color gallery.
   */
  const isColorScrollProduct =
    COLOR_SCROLL_PRODUCTS.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );
      const hasNoOrderCounter =
      
    NO_ORDER_COUNTER_NAMES.some(
      (name) => name.toLowerCase() === normalizedProductName
    );
  const hideGalleryArrows = NO_GALLERY_ARROWS_NAMES.some(
    (name) => name.toLowerCase() === normalizedProductName
  );
  const accent = isGiveaway
    ? "#6E86C7"
    : "#D8A1AF";

  const accentDark = isGiveaway
    ? "#5A70B0"
    : "#B5798A";

  const customizeRoute =
    CUSTOMIZE_ROUTES[productName];

  const customizeOnly =
    CUSTOMIZE_ONLY_NAMES.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );
      const isPlainSellableGiveaway =
    PLAIN_SELLABLE_GIVEAWAY_NAMES.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );
      const isScentVariantProduct =
    SCENT_VARIANT_PRODUCTS.some(
      (name) =>
        name.toLowerCase() ===
        normalizedProductName
    );
    

  /*
   * ============================================================
   * INITIAL COLOR
   * ============================================================
   */

  const getInitialColorIndex = () => {
    if (!product.colors?.length) {
      return 0;
    }

    if (!preselectedColor) {
      return 0;
    }

    const foundIndex =
      product.colors.findIndex(
        (color) =>
          color.name?.toLowerCase() ===
          preselectedColor.toLowerCase()
      );

    return foundIndex >= 0
      ? foundIndex
      : 0;
  };

  const [
    selectedColorIndex,
    setSelectedColorIndex,
  ] = useState(
    getInitialColorIndex()
  );

  const [
    selectedOptionIndex,
    setSelectedOptionIndex,
  ] = useState(0);

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    selectedScent,
    setSelectedScent,
  ] = useState<string | null>(
    product.scents?.[0] ?? null
  );
  const [
  selectedRibbon,
  setSelectedRibbon,
] = useState<RibbonColorId>(
  RIBBON_COLORS[0].id
);

const [plainQuantity, setPlainQuantity] = useState(1);

  // Pocket Hearts — optional personalization: initials typed as text
  // (e.g. "S & H") or an uploaded image of custom lettering, similar
  // to the reference wedding-favor tags. Only one is sent to the
  // cart — whichever the person filled in.
  const [monogramText, setMonogramText] = useState("");
  const [monogramImageUrl, setMonogramImageUrl] = useState<string | null>(
    null
  );
  const monogramFileInputRef = useRef<HTMLInputElement>(null);
  const [
    selectedNoorWhite,
    setSelectedNoorWhite,
  ] = useState(false);

  const [
    selectedNoorGray,
    setSelectedNoorGray,
  ] = useState(false);

  const [
    noorWhiteQuantity,
    setNoorWhiteQuantity,
  ] = useState(1);

  const [
    noorGrayQuantity,
    setNoorGrayQuantity,
  ] = useState(1);

  const [
    selectedBride,
    setSelectedBride,
  ] = useState(false);

  const [
    selectedGroom,
    setSelectedGroom,
  ] = useState(false);

  const [
    brideQuantity,
    setBrideQuantity,
  ] = useState(1);

  const [
    groomQuantity,
    setGroomQuantity,
  ] = useState(1);

  const [
    orderLines,
    setOrderLines,
  ] = useState<OrderLine[]>([]);

  const imageScrollRef =
    useRef<HTMLDivElement>(null);

  const imageRefs =
    useRef<(HTMLDivElement | null)[]>(
      []
    );
      const scrollSyncing = useRef(false);
        const committedNoorIds = useRef<Set<string>>(new Set());
        const selectedImageIndexRef = useRef(selectedImageIndex);
const selectedColorIndexRef = useRef(selectedColorIndex);

  const hasColors =
    (product.colors?.length ?? 0) > 0;

  const selectedColor =
    product.colors?.[
      selectedColorIndex
    ];

  const hasOptions =
    !!selectedColor?.options?.length;

  const selectedOption = hasOptions
    ? selectedColor!.options![
        selectedOptionIndex
      ]
    : undefined;

  const displayPrice =
    selectedOption?.price ??
    selectedColor?.price ??
    product.price;
      // Some products (like Tambourine) encode size right in the color name,
  // e.g. "Large (20cm)" — pull that out instead of relying on
  // product.size_ml, which is one fixed value on the product row and
  // doesn't change per-variant. Falls back to product.size_ml for
  // products that don't have a size in their variant name (Iced Latte, etc.).
  const sizeFromColorName = selectedColor?.name?.match(/\(([^)]+)\)/)?.[1];
  const displaySize = sizeFromColorName ?? (product.size_ml ? `${product.size_ml} ml` : null);

  /*
   * ============================================================
   * RESET WHEN PRODUCT CHANGES
   * ============================================================
   */

  useEffect(() => {
    const colorFromUrl =
      searchParams.get("color");

    let newColorIndex = 0;

    if (product.colors?.length) {
      const foundIndex =
        product.colors.findIndex(
          (color) =>
            color.name?.toLowerCase() ===
            colorFromUrl?.toLowerCase()
        );

      if (foundIndex >= 0) {
        newColorIndex =
          foundIndex;
      }
    }

    setSelectedColorIndex(
      newColorIndex
    );

    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);

    setSelectedScent(
      product.scents?.[0] ?? null
    );

    setSelectedNoorWhite(false);
    setSelectedNoorGray(false);

    setNoorWhiteQuantity(1);
    setNoorGrayQuantity(1);

    setSelectedBride(false);
    setSelectedGroom(false);

   setBrideQuantity(1);
    setGroomQuantity(1);

    setMonogramText("");
    setMonogramImageUrl(null);

    setOrderLines([]);

    imageRefs.current = [];

    requestAnimationFrame(() => {
      imageScrollRef.current?.scrollTo({
        left: 0,
        behavior: "auto",
      });
    });
  }, [
    product.id,
    searchParams,
  ]);

    /*
   * ============================================================
   * URL COLOR CHANGE
   * ============================================================
   *
   * BUG FIX: this effect used to include selectedColorIndex in its
   * dependency array, which meant it re-ran on every swipe — and each
   * time, it re-read the SAME original ?color= URL value (swiping
   * never updates the URL) and forcibly snapped the color back to it.
   * That caused the "snaps back and forth on its own" bug whenever a
   * product page was opened with a ?color= param (e.g. from the
   * homepage Best Sellers carousel).
   *
   * Fix: track the last URL color value we've already synced to, in a
   * ref. Only act when the URL's color value actually CHANGES (e.g.
   * real navigation), not every time selectedColorIndex changes from
   * the user's own swiping.
   */

  const lastSyncedUrlColor = useRef<string | null>(null);

  useEffect(() => {
    if (!product.colors?.length) {
      return;
    }

    const colorFromUrl =
      searchParams.get("color");

    if (!colorFromUrl) {
      return;
    }

    if (colorFromUrl === lastSyncedUrlColor.current) {
      return;
    }

    lastSyncedUrlColor.current = colorFromUrl;

    const foundIndex =
      product.colors.findIndex(
        (color) =>
          color.name?.toLowerCase() ===
          colorFromUrl.toLowerCase()
      );

    if (foundIndex >= 0) {
      setSelectedColorIndex(
        foundIndex
      );

      setSelectedOptionIndex(0);

      /*
       * IMPORTANT:
       *
       * Do NOT reset the image for Marble/Dimple/Iced Latte.
       * Their gallery itself controls the color.
       */
      if (!isColorScrollProduct) {
        setSelectedImageIndex(0);
      }
    }
  }, [
    searchParams,
    product.id,
    product.colors,
    isColorScrollProduct,
  ]);

  /*
   * ============================================================
   * GALLERY
   * ============================================================
   */

  const galleryItems: GalleryItem[] =
    (() => {
      const items: GalleryItem[] = [];

      const addImage = (
        url?: string | null,
        colorName?: string | null,
        colorIndex: number = -1
      ) => {
        if (!url) return;

        if (
          !items.some(
            (item) =>
              item.url === url
          )
        ) {
          items.push({
            url,
            colorName:
              colorName ?? null,
            colorIndex,
          });
        }
      };

      const addImages = (
        urls?: string[],
        colorName?: string | null,
        colorIndex: number = -1
      ) => {
        if (!urls) return;

        urls.forEach((url) => {
          addImage(
            url,
            colorName,
            colorIndex
          );
        });
      };

      /*
       * ========================================================
       * MARBLE / DIMPLE / ICED LATTE
       * ========================================================
       *
       * SPECIAL BEHAVIOR:
       *
       * Every color is added to the SAME gallery.
       *
       * Example:
       *
       * image 0 -> White
       * image 1 -> Pink
       * image 2 -> Blue
       * image 3 -> Green
       *
       * Swiping therefore moves through colors.
       */
      if (isColorScrollProduct) {
        product.colors?.forEach(
          (color, colorIndex) => {
            /*
             * Prefer the color's own image_urls.
             */
            addImages(
              color.image_urls,
              color.name,
              colorIndex
            );

            /*
             * Also support a single image_url.
             */
            addImage(
              color.image_url,
              color.name,
              colorIndex
            );

            /*
             * If the color has options, include their
             * images too.
             */
            color.options?.forEach(
              (option) => {
                addImages(
                  option.image_urls,
                  color.name,
                  colorIndex
                );

                addImage(
                  option.image_url,
                  color.name,
                  colorIndex
                );
              }
            );
          }
        );

        /*
         * Fallback if colors don't contain images.
         */
        if (items.length === 0) {
          addImages(
            product.image_urls,
            null,
            -1
          );
        }

        return items;
      }

      /*
       * ========================================================
       * NORMAL PRODUCTS
       * ========================================================
       */

                    if (hasColors && !hasOptions && !isPlainSellableGiveaway) {
      // Simple color-only products (no nested options): the gallery
      // spans ALL colors, not just the selected one — this is what
      // lets swiping the main photo cycle through colors directly.
      product.colors.forEach((color) => {
        addImages(color.image_urls, color.name);
        addImage(color.image_url, color.name);
      });

      if (items.length === 0) {
        addImages(product.image_urls, selectedColor?.name ?? null);
      }
    } else if (selectedColor) {
      // Products with nested options (e.g. Bloom Wand): unchanged —
      // gallery stays scoped to the selected color/option's own photos.
    if (hasOptions && selectedOption) {
  addImages(selectedOption.image_urls, selectedColor.name);
  addImage(selectedOption.image_url, selectedColor.name);

  // If this option alone doesn't give more than one image, pull in
  // the color's other option(s) too, so the gallery — and its
  // arrows — still has something to browse.
  if (items.length <= 1) {
    selectedColor.options?.forEach((opt) => {
      if (opt === selectedOption) return;
      addImages(opt.image_urls, selectedColor.name);
      addImage(opt.image_url, selectedColor.name);
    });
  }
}

      // Plain Candle: if the selected size already has its own photo,
      // don't also add the color's default photo (that's the other
      // size's picture, and it's what made the swipe appear).
      const singlePhotoPerOption = normalizedProductName === "plain candle";

      if (!(singlePhotoPerOption && items.length > 0)) {
        addImages(selectedColor.image_urls, selectedColor.name);
        addImage(selectedColor.image_url, selectedColor.name);
      }
      // Only pull in other options' photos here for products that
      // actually want a combined gallery across options (none
      // currently do, but this stays generic for future cases). For
      // an ordinary size/style toggle like Plain Candle's 150ml vs
      // 380ml, each option's gallery should be scoped to itself —
      // switching size must not keep the other size's photo(s) in
      // the swipeable gallery.
      if (!hasOptions) {
        selectedColor.options?.forEach((option) => {
          addImages(option.image_urls, selectedColor.name);
          addImage(option.image_url, selectedColor.name);
        });
      }

      if (items.length === 0) {
        addImages(product.image_urls, selectedColor.name);
      }
    } else {
      addImages(product.image_urls, null);
    }
      return items;
    })();

  const gallery =
    galleryItems.map(
      (item) => item.url
    );

  const galleryColorNames =
    galleryItems.map(
      (item) =>
        item.colorName
    );

  const activeGalleryColor =
    galleryColorNames[
      selectedImageIndex
    ] ??
    selectedColor?.name ??
    null;

  /*
   * ============================================================
   * SCROLL TO IMAGE
   * ============================================================
   */

  function scrollToImage(
    index: number
  ) {
    if (!gallery.length) {
      return;
    }

    const safeIndex =
      Math.max(
        0,
        Math.min(
          index,
          gallery.length - 1
        )
      );

    const container =
      imageScrollRef.current;

    if (!container) {
      return;
    }

    const slide =
      imageRefs.current[
        safeIndex
      ];

    if (!slide) {
      return;
    }

    const containerWidth =
      container.clientWidth;

    const slideLeft =
      slide.offsetLeft;

    const slideWidth =
      slide.clientWidth;

    const targetLeft =
      slideLeft -
      (containerWidth -
        slideWidth) /
        2;

    container.scrollTo({
      left: Math.max(
        0,
        targetLeft
      ),
      behavior: "smooth",
    });

    setSelectedImageIndex(
      safeIndex
    );

    /*
     * ========================================================
     * IMPORTANT:
     * Update selected color when the gallery moves.
     * ========================================================
     */
    if (
      isColorScrollProduct
    ) {
      const galleryColorIndex =
        galleryItems[
          safeIndex
        ]?.colorIndex;

      if (
        galleryColorIndex >= 0 &&
        galleryColorIndex !==
          selectedColorIndex
      ) {
        // Mark this as a scroll-originated color change (same as
        // handleGalleryScroll already does) — otherwise the "reset
        // gallery on color change" effect thinks this is a fresh
        // manual pick and snaps scroll position back to 0 right
        // after we just smooth-scrolled forward, causing the
        // next-then-snap-back flicker on the arrow buttons/dots.
        scrollSyncing.current = true;

        setSelectedColorIndex(
          galleryColorIndex
        );

        setSelectedOptionIndex(0);
      }
    }
  }
useEffect(() => {
  selectedImageIndexRef.current = selectedImageIndex;
}, [selectedImageIndex]);

useEffect(() => {
  selectedColorIndexRef.current = selectedColorIndex;
}, [selectedColorIndex]);
  /*
   * ============================================================
   * HANDLE GALLERY SCROLL
   * ============================================================
   */

const scrollSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleGalleryScroll() {
  const container = imageScrollRef.current;
  if (!container || gallery.length <= 1) return;

  // Clear any pending settle check — we're still actively scrolling.
  if (scrollSettleTimer.current) clearTimeout(scrollSettleTimer.current);

  scrollSettleTimer.current = setTimeout(() => {
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    imageRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(slideCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

if (closestIndex !== selectedImageIndexRef.current) {
  setSelectedImageIndex(closestIndex);

  if (isColorScrollProduct) {
    const item = galleryItems[closestIndex];
    if (item && item.colorIndex >= 0 && item.colorIndex !== selectedColorIndexRef.current) {
      scrollSyncing.current = true;
      setSelectedColorIndex(item.colorIndex);
      setSelectedOptionIndex(0);
    }
  }
}
  }, 100); // waits until scrolling has paused for 100ms
}
/*
   * ============================================================
   * NEXT / PREVIOUS
   * ============================================================
   */

  function nextImage() {
    if (gallery.length <= 1) {
      return;
    }

    const next =
      selectedImageIndex >=
      gallery.length - 1
        ? 0
        : selectedImageIndex + 1;

    scrollToImage(next);
  }

  function previousImage() {
    if (gallery.length <= 1) {
      return;
    }

    const previous =
      selectedImageIndex <= 0
        ? gallery.length - 1
        : selectedImageIndex - 1;

    scrollToImage(previous);
  }

  /*
   * ============================================================
   * LOAD CART
   * ============================================================
   */

  function createLineId(
    colorName: string,
    scentName: string | null
  ): string {
    return [
      product.id,
      colorName || "default",
      scentName || "unscented",
    ]
      .join("-")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      const existingCart =
        JSON.parse(
          localStorage.getItem(
            "cart"
          ) || "[]"
        );

      if (isTwoColorProduct) {
        const whiteItem =
          existingCart.find(
            (item: any) =>
              item.productId ===
                product.id &&
              item.productName ===
                productName &&
              item.color ===
                "White"
          );

        const grayItem =
          existingCart.find(
            (item: any) =>
              item.productId ===
                product.id &&
              item.productName ===
                productName &&
              item.color ===
                "Gray"
          );

        if (whiteItem) {
          setSelectedNoorWhite(
            true
          );

          setNoorWhiteQuantity(
            Number(
              whiteItem.quantity
            ) || 1
          );
        }

        if (grayItem) {
          setSelectedNoorGray(
            true
          );

          setNoorGrayQuantity(
            Number(
              grayItem.quantity
            ) || 1
          );
        }

        return;
      }

      if (isQuackAndKiss) {
        const brideItem =
          existingCart.find(
            (item: any) =>
              item.productId ===
                product.id &&
              item.productName ===
                productName &&
              item.color ===
                "Bride Duck"
          );

        const groomItem =
          existingCart.find(
            (item: any) =>
              item.productId ===
                product.id &&
              item.productName ===
                productName &&
              item.color ===
                "Groom Duck"
          );

        if (brideItem) {
          setSelectedBride(true);

          setBrideQuantity(
            Number(
              brideItem.quantity
            ) || 1
          );
        }

        if (groomItem) {
          setSelectedGroom(true);

          setGroomQuantity(
            Number(
              groomItem.quantity
            ) || 1
          );
        }

        return;
      }

      const productItems =
        existingCart.filter(
          (item: any) =>
            item.productId ===
              product.id &&
            item.productName ===
              productName
        );

      const lines: OrderLine[] =
        productItems.map(
          (item: any) => {
            const colorName =
              item.color ??
              productName;

            const scentName =
              item.scent ?? null;

            return {
              id:
                item.id ||
                createLineId(
                  colorName,
                  scentName
                ),

              colorName,
              scentName,

              price:
                Number(
                  item.price
                ) ||
                Number(
                  product.price
                ),

               quantity:
                Number(
                  item.quantity
                ) || 1,

              image:
                item.image ?? "",

              inCart: true,
            };
          }
        );

      setOrderLines(lines);
    } catch {
      setOrderLines([]);
    }
  }, [
    product.id,
    productName,
    isTwoColorProduct,
    isQuackAndKiss,
  ]);
     useEffect(() => {
    if (productName !== "Tambourine") return;

    function syncTambourineOrderWithCart() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      setOrderLines((prev) =>
        prev
          .map((line) => {
            // Draft lines (staged with "+ Add to Order" but not yet
            // committed via "Add Order to Cart") aren't in the cart
            // yet — leave them untouched rather than treating their
            // absence as "removed".
            if (!line.inCart) {
              return line;
            }

            const cartMatch = cart.find((item: any) => item.id === line.id);

            // The line was committed to the cart before, but is no
            // longer there (removed from the drawer/cart page) —
            // drop it from this page too instead of leaving a stale
            // row behind.
            if (!cartMatch) {
              return null;
            }

            return { ...line, quantity: cartMatch.quantity };
          })
          .filter((line): line is OrderLine => line !== null)
      );
    }

    window.addEventListener("cartUpdated", syncTambourineOrderWithCart);

    syncTambourineOrderWithCart();

    return () => {
      window.removeEventListener("cartUpdated", syncTambourineOrderWithCart);
    };
  }, [productName]);

  useEffect(() => {
    if (!isTwoColorProduct) return;

    const whiteId = `${product.id}-white`;
    const grayId = `${product.id}-gray`;

    function syncNoorWithCart() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      const whiteItem = cart.find((item: any) => item.id === whiteId);
      const grayItem = cart.find((item: any) => item.id === grayId);

      // A color counts as "removed" only if it was in the cart before
      // and isn't now. A color the person has only tapped (staged, not
      // yet added) was never in the cart, so it's left alone.
      const whiteRemoved =
        !whiteItem && committedNoorIds.current.has(whiteId);
      const grayRemoved =
        !grayItem && committedNoorIds.current.has(grayId);

      if (whiteItem) {
        committedNoorIds.current.add(whiteId);
        setSelectedNoorWhite(true);
        setNoorWhiteQuantity(Number(whiteItem.quantity) || 1);
      } else if (whiteRemoved) {
        committedNoorIds.current.delete(whiteId);
        setSelectedNoorWhite(false);
        setNoorWhiteQuantity(1);
      }

      if (grayItem) {
        committedNoorIds.current.add(grayId);
        setSelectedNoorGray(true);
        setNoorGrayQuantity(Number(grayItem.quantity) || 1);
      } else if (grayRemoved) {
        committedNoorIds.current.delete(grayId);
        setSelectedNoorGray(false);
        setNoorGrayQuantity(1);
      }

      setOrderLines((prev) => {
        const next: OrderLine[] = prev
          .filter(
            (line) =>
              !(line.id === whiteId && whiteRemoved) &&
              !(line.id === grayId && grayRemoved)
          )
          .map((line) => {
            const item =
              line.id === whiteId
                ? whiteItem
                : line.id === grayId
                ? grayItem
                : null;

            return item
              ? {
                  ...line,
                  quantity: Number(item.quantity) || 1,
                  inCart: true,
                }
              : line;
          });

        // If the page loaded with Noor already in the cart, there is
        // no line for it yet — create one so the page's own +/-, remove
        // and total all work on it.
        const ensureLine = (id: string, colorName: string, item: any) => {
          if (item && !next.some((line) => line.id === id)) {
            next.push({
              id,
              colorName,
              scentName: null,
              price: Number(item.price) || Number(product.price),
              quantity: Number(item.quantity) || 1,
              image: item.image ?? "",
              inCart: true,
            });
          }
        };

        ensureLine(whiteId, "White", whiteItem);
        ensureLine(grayId, "Gray", grayItem);

        return next;
      });
    }

    window.addEventListener("cartUpdated", syncNoorWithCart);

    syncNoorWithCart();

    return () => {
      window.removeEventListener("cartUpdated", syncNoorWithCart);
    };
  }, [isTwoColorProduct, product.id, product.price]);

  /*
   * ============================================================
   * QUACK & KISS — TWO-WAY SYNC WITH CART
   * ============================================================
   *
   * Mirrors the Noor/Tambourine pattern above: whenever the cart
   * changes anywhere (including the +/- buttons in the cart
   * drawer), pull the Bride/Groom quantities back into this page's
   * state so editing "7 -> 10" in the drawer shows "10" here too,
   * and vice versa.
   */
  useEffect(() => {
    if (!isQuackAndKiss) return;

    function syncQuackWithCart() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");

      const brideId = `${product.id}-bride`;
      const groomId = `${product.id}-groom`;

      const brideItem = cart.find((item: any) => item.id === brideId);
      const groomItem = cart.find((item: any) => item.id === groomId);

      if (brideItem) {
        setSelectedBride(true);
        setBrideQuantity(Number(brideItem.quantity) || 1);
      } else {
        setSelectedBride(false);
        setBrideQuantity(1);
      }

      if (groomItem) {
        setSelectedGroom(true);
        setGroomQuantity(Number(groomItem.quantity) || 1);
      } else {
        setSelectedGroom(false);
        setGroomQuantity(1);
      }

      setOrderLines((prev) => {
        const withoutQuack = prev.filter(
          (line) => line.id !== brideId && line.id !== groomId
        );

        const lines = [...withoutQuack];

        if (brideItem) {
          lines.push({
            id: brideId,
            colorName: "Bride Duck",
            scentName: null,
            price: Number(brideItem.price) || Number(displayPrice),
            quantity: Number(brideItem.quantity) || 1,
            image: QUACK_IMAGES.bride,
          });
        }

        if (groomItem) {
          lines.push({
            id: groomId,
            colorName: "Groom Duck",
            scentName: null,
            price: Number(groomItem.price) || Number(displayPrice),
            quantity: Number(groomItem.quantity) || 1,
            image: QUACK_IMAGES.groom,
          });
        }

        return lines;
      });
    }

    window.addEventListener("cartUpdated", syncQuackWithCart);

    return () => {
      window.removeEventListener("cartUpdated", syncQuackWithCart);
    };
  }, [isQuackAndKiss, product.id, displayPrice]);

  /*
   * ============================================================
   * RESET GALLERY WHEN COLOR CHANGES
   * ============================================================
   *
   * NORMAL PRODUCTS:
   *   Reset to their first image.
   *
   * MARBLE / DIMPLE / ICED LATTE:
   *   DO NOT RESET.
   *
   * Their gallery is the color selector.
   */
    useEffect(() => {
    if (scrollSyncing.current) {
      // This color change came FROM scrolling — don't fight it by
      // resetting the scroll position back to the start.
      scrollSyncing.current = false;
      return;
    }

    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);

    imageRefs.current = [];

    requestAnimationFrame(() => {
      imageScrollRef.current?.scrollTo({
        left: 0,
        behavior: "auto",
      });
    });
  }, [selectedColorIndex]);

  /*
   * ============================================================
   * RESET GALLERY WHEN OPTION CHANGES
   * ============================================================
   */

  useEffect(() => {
    /*
     * Do not interfere with the color gallery.
     */
    if (isColorScrollProduct) {
      return;
    }

    setSelectedImageIndex(0);

    imageRefs.current = [];

    requestAnimationFrame(() => {
      imageScrollRef.current?.scrollTo({
        left: 0,
        behavior: "auto",
      });
    });
  }, [
    selectedOptionIndex,
    isColorScrollProduct,
  ]);

  /*
   * ============================================================
   * GALLERY SCROLL LISTENER
   * ============================================================
   */

  useEffect(() => {
    const container =
      imageScrollRef.current;

    if (!container) {
      return;
    }

    let ticking = false;

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;

      requestAnimationFrame(() => {
        handleGalleryScroll();
        ticking = false;
      });
    };

    container.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    return () => {
      container.removeEventListener(
        "scroll",
        onScroll
      );
    };
 }, [
  gallery.length,
  isColorScrollProduct,
]);

  /*
   * ============================================================
   * NOOR EL QAMAR
   * ============================================================
   */

   function addNoorOrderToCart() {
    if (!selectedNoorWhite && !selectedNoorGray) return;

    // Unlike addToCart() elsewhere (which is a repeatable "+1 per
    // click" action), this button confirms whatever quantity is
    // currently staged on the page — so the cart line should be SET
    // to that number, not incremented by it each time the button is
    // pressed. Removing any existing line first, then adding fresh,
    // gives set semantics while still using the shared helper (so
    // the drawer still pops open to confirm).
 if (selectedNoorWhite) {
  const id = `${product.id}-white`;
  removeCartItem(id);
  addToCart({
    id,
    productId: product.id,
    productName,
    price: Number(displayPrice),
    quantity: noorWhiteQuantity,
    scent: null,
    color: "White",
    image: gallery[0] ?? "",
    category: product.category,   // add this line
  });
}

  if (selectedNoorGray) {
  const id = `${product.id}-gray`;
  removeCartItem(id);
  addToCart({
    id,
    productId: product.id,
    productName,
    price: Number(displayPrice),
    quantity: noorGrayQuantity,
    scent: null,
    color: "Gray",
    image: gallery[0] ?? "",
    category: product.category,   // add this line
  });
}

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === `${product.id}-white` || line.id === `${product.id}-gray`
          ? { ...line, inCart: true }
          : line
      )
    );
  }
  function removeNoorColor(color: "White" | "Gray") {
    const id = `${product.id}-${color.toLowerCase()}`;
    const isCommitted = orderLines.find((line) => line.id === id)?.inCart;

    setOrderLines((prev) => prev.filter((line) => line.id !== id));

    // Only touch the real cart if this line was actually committed —
    // same reasoning as updateNoorQuantity above.
    if (isCommitted) {
      removeCartItem(id);
    }

    if (color === "White") {
      setSelectedNoorWhite(false);
      setNoorWhiteQuantity(1);
    }

    if (color === "Gray") {
      setSelectedNoorGray(false);
      setNoorGrayQuantity(1);
    }
  }

    function updateNoorQuantity(
    color: "White" | "Gray",
    newQuantity: number
  ) {
    if (newQuantity <= 0) {
      removeNoorColor(color);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);
    const id = `${product.id}-${color.toLowerCase()}`;

    if (color === "White") {
      setNoorWhiteQuantity(safeQuantity);
    } else {
      setNoorGrayQuantity(safeQuantity);
    }

     const isCommitted = orderLines.find((line) => line.id === id)?.inCart;

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: safeQuantity } : line
      )
    );

    // Only write to the real cart (and let its "cartUpdated" dispatch
    // fire) if this color was actually committed via "Add to Cart".
    // Calling updateCartItemQuantity for a line that was never really
    // added does nothing to the cart itself, but setCart() ALWAYS
    // dispatches "cartUpdated" regardless — and syncNoorWithCart
    // would then see "not found in cart" and wrongly treat that as
    // "removed", wiping the draft selection. This guard is what was
    // missing.
    if (isCommitted) {
      updateCartItemQuantity(id, safeQuantity);
    }
  }
  

  /*
   * ============================================================
   * QUACK & KISS
   * ============================================================
   *
   * Both add-functions now dedupe by ID rather than by matching
   * productId+productName+color. Matching by color broke the
   * moment "Bride"/"Groom" were renamed to "Bride Duck"/"Groom
   * Duck" — any stale cart entry still saved under the old color
   * name no longer matched, so a second entry got pushed under the
   * SAME id (this was the "two children with the same key,
   * `10-bride`" warning). Filtering out any existing entry with
   * this id first — regardless of what color name it was saved
   * under — makes this safe no matter what's already in
   * localStorage.
   */

  function addBrideToCart() {
    const id = `${product.id}-bride`;

    const existingCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const updatedCart = existingCart.filter(
      (item: any) => item.id !== id
    );

updatedCart.push({
  id,
  productId: product.id,
  productName,
  price: Number(displayPrice),
  quantity: brideQuantity,
  scent: null,
  color: "Bride Duck",
  image: QUACK_IMAGES.bride,
  category: product.category,   // add this line
});

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedBride(true);

    setOrderLines((prev) => {
      const withoutExisting = prev.filter((line) => line.id !== id);

      return [
        ...withoutExisting,
        {
          id,
          colorName: "Bride Duck",
          scentName: null,
          price: Number(displayPrice),
          quantity: brideQuantity,
          image: QUACK_IMAGES.bride,
        },
      ];
    });
  }

  function addGroomToCart() {
    const id = `${product.id}-groom`;

    const existingCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const updatedCart = existingCart.filter(
      (item: any) => item.id !== id
    );

  updatedCart.push({
  id,
  productId: product.id,
  productName,
  price: Number(displayPrice),
  quantity: groomQuantity,
  scent: null,
  color: "Groom Duck",
  image: QUACK_IMAGES.groom,
  category: product.category,   // add this line
});

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedGroom(true);

    setOrderLines((prev) => {
      const withoutExisting = prev.filter((line) => line.id !== id);

      return [
        ...withoutExisting,
        {
          id,
          colorName: "Groom Duck",
          scentName: null,
          price: Number(displayPrice),
          quantity: groomQuantity,
          image: QUACK_IMAGES.groom,
        },
      ];
    });
  }

  function addQuackAndKissToCart() {
    // Bride/Groom are already written to the cart the moment each is
    // selected (see addBrideToCart/addGroomToCart above), so this
    // button's only remaining job is to open the drawer for review —
    // it should NOT re-add them, or every confirm click would double
    // the quantity.
    window.dispatchEvent(new Event("openCart"));
  }

  function removeDuck(
    type: "Bride" | "Groom"
  ) {
    const id = `${product.id}-${type.toLowerCase()}`;

    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const updatedCart =
      existingCart.filter(
        (item: any) =>
          item.id !== id
      );

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setOrderLines((prev) =>
      prev.filter(
        (line) =>
          line.id !== id
      )
    );

    if (type === "Bride") {
      setSelectedBride(false);
      setBrideQuantity(1);
    }

    if (type === "Groom") {
      setSelectedGroom(false);
      setGroomQuantity(1);
    }
  }

  function updateDuckQuantity(
    type: "Bride" | "Groom",
    newQuantity: number
  ) {
    if (newQuantity <= 0) {
      removeDuck(type);
      return;
    }

    const safeQuantity =
      Math.max(
        1,
        newQuantity
      );

    const id = `${product.id}-${type.toLowerCase()}`;

    if (type === "Bride") {
      setBrideQuantity(
        safeQuantity
      );
    } else {
      setGroomQuantity(
        safeQuantity
      );
    }

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === id
          ? {
              ...line,
              quantity:
                safeQuantity,
            }
          : line
      )
    );

    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const updatedCart =
      existingCart.map(
        (item: any) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  safeQuantity,
              }
            : item
      );

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  /*
   * ============================================================
   * POCKET HEARTS — PERSONALIZATION
   * ============================================================
   */

  function handleMonogramImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image under 5MB.");
      return;
    }

    setMonogramImageUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  /*
   * ============================================================
   * REGULAR CART
   * ============================================================
   */

  function addRegularProductToCart() {
        const productColor =
      normalizedProductName === "plain candle" &&
      hasOptions &&
      selectedOption?.name
        ? `${selectedColor?.name ?? productName} · ${selectedOption.name}`
        : selectedColor?.name ?? productName;

    // Force scent to null whenever "Unscented" is the currently
    // selected Style option — regardless of whatever's left sitting
    // in selectedScent state from initialization or a prior pick.
    const isUnscentedSelected =
      hasOptions && selectedOption?.name === "Unscented";

    const productScent = isUnscentedSelected
      ? null
      : selectedScent ?? null;

    const lineId = createLineId(productColor, productScent);

    // For color-scroll products (Marble Moon, Forever Clasp, etc.)
    // `gallery` spans every color in one swipeable array, so
    // gallery[0] is always the FIRST color's photo — not necessarily
    // the one actually selected. Prefer the selected option/color's
    // own image first, and only fall back to the gallery for
    // products where gallery genuinely is scoped to one color.
        const lineImage =
      selectedOption?.image_url ??
      selectedOption?.image_urls?.[0] ??
      selectedColor?.image_url ??
      selectedColor?.image_urls?.[0] ??
      gallery[0] ??
      "";

    // Pocket Hearts personalization — optional, whichever the person
    // filled in (typed initials or an uploaded image). Always
    // undefined for every other product since this section only
    // renders for Pocket Hearts.
          const isMonogramProduct =
      productName === "Pocket Hearts" || productName === "Rustic Warmth";

    const monogramTextToUse =
      isMonogramProduct && monogramText.trim()
        ? monogramText.trim()
        : undefined;

    const monogramImageToUse =
      isMonogramProduct && monogramImageUrl
        ? monogramImageUrl
        : undefined;

    // Only attach personalization when this is Pocket Hearts AND the
    // person actually filled something in — every other product (and
    // a blank Pocket Hearts order) gets no customization field at all.
    const monogramCustomization =
      monogramTextToUse || monogramImageToUse
        ? {
            type: "monogram" as const,
            monogramText: monogramTextToUse ?? "",
            monogramImage: monogramImageToUse,
          }
        : undefined;

    // Single source of truth for cart writes — addToCart() already
    // finds a line with this exact id and increments its quantity by
    // 1 instead of creating a duplicate, or adds a fresh line at
    // quantity 1 if this variant isn't in the cart yet.
 addToCart({
  id: lineId,
  productId: product.id,
  productName,
  price: Number(displayPrice),
  quantity: 1,
  scent: productScent,
  color: productColor,
  image: lineImage,
  category: product.category,   // add this line
  customization: monogramCustomization,
});

    setOrderLines((prev) => {
      const existingLineIndex = prev.findIndex(
        (line) => line.id === lineId
      );

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          quantity: updated[existingLineIndex].quantity + 1,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: lineId,
          colorName: productColor,
          scentName: productScent,
          price: Number(displayPrice),
          quantity: 1,
          image: lineImage,
          monogramText: monogramTextToUse,
          monogramImage: monogramImageToUse,
        },
      ];
    });

      // Personalization is entered fresh per line — clear it after
    // adding so a follow-up click doesn't silently reuse it.
    if (isMonogramProduct) {
      setMonogramText("");
      setMonogramImageUrl(null);
    }
  }

  /*
   * ============================================================
   * TAMBOURINE PLAIN — STACKABLE ORDER
   * ============================================================
   */

  function addTambourineLineToOrder() {
    const productColor = selectedColor?.name ?? productName;
    const ribbon = RIBBON_COLORS.find((c) => c.id === selectedRibbon)!;

    const lineId = [product.id, productColor, ribbon.id]
      .join("-")
      .toLowerCase()
      .replace(/\s+/g, "-");

    setOrderLines((prev) => {
      const existingIndex = prev.findIndex((line) => line.id === lineId);

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + plainQuantity,
        };
        return updated;
      }

       return [
        ...prev,
        {
          id: lineId,
          colorName: `Plain · ${productColor} · ${ribbon.label} Ribbon`,
          scentName: null,
          price: Number(displayPrice),
          quantity: plainQuantity,
          image: gallery[0] ?? "",
          inCart: false,
        },
      ];
    });

    setPlainQuantity(1);
  }

    function updateTambourineLineQuantity(lineId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeTambourineLine(lineId);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: safeQuantity } : line
      )
    );

    // No-op if this line hasn't been committed to the cart yet
    // (still just staged locally) — otherwise keeps the real cart in
    // sync, quietly, without popping the drawer open.
    updateCartItemQuantity(lineId, safeQuantity);
  }

  function removeTambourineLine(lineId: string) {
    setOrderLines((prev) => prev.filter((line) => line.id !== lineId));

    removeCartItem(lineId);
  }

 function addTambourineOrderToCart() {
    if (!orderLines.length) return;

    // Write each stacked size+ribbon combo through the shared helper
    // — this is what actually makes it show in the cart drawer, and
    // keeps it deduped/in sync with everywhere else that reads the
    // cart.
        orderLines.forEach((line) => {
      const alreadyInCart = getCart().some((c) => c.id === line.id);

      if (alreadyInCart) {
        // Set to the quantity shown on this page instead of adding on top
        updateCartItemQuantity(line.id, line.quantity);
      } else {
     addToCart({
  id: line.id,
  productId: product.id,
  productName,
  price: line.price,
  quantity: line.quantity,
  scent: null,
  color: line.colorName,
  image: line.image,
  category: product.category,   // add this line
});
      }
    });

    // updateCartItemQuantity doesn't open the drawer, so open it here
    window.dispatchEvent(new Event("openCart"));

    // Don't clear orderLines — they're now the real cart lines for
    // this product, so keep them visible here too (matches how the
    // regular Add to Cart flow leaves "Your Order" showing).
    setOrderLines((prev) =>
      prev.map((line) => ({ ...line, inCart: true }))
    );
  }

  

  function updateNormalLineQuantity(
    lineId: string,
    newQuantity: number
  ) {
    if (newQuantity <= 0) {
      removeLine(lineId);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? { ...line, quantity: safeQuantity }
          : line
      )
    );

    // Shared helper — writes the real cart and tells the drawer to
    // just refresh its count, not pop open.
    updateCartItemQuantity(lineId, safeQuantity);
  }

  function removeLine(id: string) {
    setOrderLines((prev) => prev.filter((line) => line.id !== id));

    removeCartItem(id);
  }

  const totalQuantity =
    orderLines.reduce(
      (sum, line) =>
        sum + line.quantity,
      0
    );

  const totalOrderPrice =
    orderLines.reduce(
      (sum, line) =>
        sum +
        line.price *
          line.quantity,
      0
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div
      className="relative min-h-screen w-full overflow-visible font-sans"
      style={{
        backgroundColor:
          "#EFE3C4",
        color: "#000000",
      }}
    >
      {!isMenuOpen && (
        <button
          onClick={() =>
            router.back()
          }
          aria-label="Go back"
          className="group fixed left-6 top-24 z-40 flex items-center gap-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-60 md:left-10 md:top-28"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.8}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
        </button>
      )}

      <main className="relative mx-auto w-full max-w-7xl overflow-visible px-5 pb-16 pt-2 md:px-10 md:pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">

          {/* ================================================== */}
          {/* LEFT */}
          {/* ================================================== */}

          <section className="min-w-0">
            <div className="relative">

              <div
                className="pointer-events-none absolute left-[8%] top-[8%] h-[75%] w-[75%] rounded-full opacity-20 blur-3xl"
                style={{
                  backgroundColor:
                    accent,
                }}
              />

              {/* ==================================================
                  IMAGE GALLERY
                  ================================================== */}

              <div
                ref={imageScrollRef}
                className="relative flex h-[min(62vw,600px)] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
                style={{
                  scrollbarWidth:
                    "none",
                  WebkitOverflowScrolling:
                    "touch",
                  touchAction:
                    "pan-x pan-y",
                  overscrollBehaviorX:
                    "contain",
                  overscrollBehaviorY:
                    "auto",
                  scrollSnapType:
                    "x mandatory",
                }}
              >
                {gallery.length > 0 ? (
                  gallery.map(
                    (
                      url,
                      index
                    ) => (
                      <div
                        key={`${product.id}-${url}-${index}`}
                        ref={(
                          element
                        ) => {
                          imageRefs.current[
                            index
                          ] =
                            element;
                        }}
                                                className={`flex h-full w-full flex-shrink-0 snap-center snap-always items-center justify-center ${gallerySlidePadding}`}
                        style={{
                          scrollSnapAlign:
                            "center",
                        }}
                      >
                                               <img
  src={url}
  alt={`${productName} ${
    galleryColorNames[index] ?? ""
  } image ${index + 1}`}
  loading="lazy"
  decoding="async"
  className="h-full w-full select-none object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.10)]"
  style={{
    transform: `translateY(${getGalleryImageOffsetY(index)}px) scale(${getGalleryImageScale(index)})`,
  }}
  draggable={false}
/>
                      </div>
                    )
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm opacity-40">
                    No image available
                  </div>
                )}
              </div>

              {/*
                Prev/Next arrows live OUTSIDE imageScrollRef (the
                scrolling container) so they're siblings of it inside
                the non-scrolling outer wrapper instead. They used to
                be positioned absolute INSIDE the scroll container
                itself — since that container also has position:
                relative, the buttons' absolute positioning was
                anchored to the scrollable CONTENT, not the visible
                viewport, so they scrolled away with the images and
                only looked correct on the very first photo.
              */}
                                         {gallery.length > 1 && !hideGalleryArrows && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:brightness-95 active:scale-95"
                    style={{
                      backgroundColor: `${accent}1F`,
                      color: accent,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <ChevronLeft size={18} strokeWidth={2.2} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:brightness-95 active:scale-95"
                    style={{
                      backgroundColor: `${accent}1F`,
                      color: accent,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <ChevronRight size={18} strokeWidth={2.2} />
                  </button>
                </>
              )}
             </div>

            {/* ==================================================
                ACTIVE COLOR
                ================================================== */}

                        {hasColors &&
              selectedColor?.name && (
                <div className="mt-1 flex justify-center">
                  <span
                    className="rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
                    style={{
                      backgroundColor:
                        `${accent}1A`,
                      color:
                        accent,
                    }}
                  >
                    {
                      selectedColor.name
                    }
                  </span>
                </div>
              )}

            {/* ==================================================
                PRODUCT TITLE
                ================================================== */}

            <div className="mt-3 flex flex-col items-center text-center">

                            {productName !== "Rustic Warmth" && (
                <p
                  className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: accent,
                  }}
                >
                  Handpoured With Love
                </p>
              )}

              <h1
                className="max-w-xl px-3 text-3xl font-bold uppercase leading-[1.1] tracking-wide md:text-5xl"
                style={{
                  fontFamily:
                    "Georgia, serif",
                  color:
                    "#000000",
                }}
              >
                {productName}
              </h1>

              <div
                className="mt-1 h-[2px] w-10 rounded-full"
                style={{
                  backgroundColor:
                    accent,
                }}
              />

              <div className="mt-2 flex items-center justify-center gap-4">

                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-bold md:text-3xl"
                    style={{
                      color:
                        accent,
                    }}
                  >
                    {
                      displayPrice
                    }
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    EGP
                  </span>
                </div>

                                {displaySize && (
                  <>
                    <span
                      className="h-5 w-px"
                      style={{
                        backgroundColor:
                          "#C8B99D",
                      }}
                    />

                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.18em]"
                        style={{
                          color:
                            accent,
                        }}
                      >
                        Size
                      </span>

                      <span className="text-sm font-semibold">
                        {displaySize}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ==================================================
                GALLERY DOTS
                ================================================== */}

            {gallery.length > 1 && (
              <div className="mt-2 flex justify-center gap-2">
                {gallery.map(
                  (
                    _,
                    index
                  ) => (
                    <button
                      key={`dot-${product.id}-${index}`}
                      type="button"
                      aria-label={`Go to ${
                        galleryColorNames[
                          index
                        ] ??
                        "image"
                      }`}
                      onClick={() =>
                        scrollToImage(
                          index
                        )
                      }
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width:
                          selectedImageIndex ===
                          index
                            ? "28px"
                            : "6px",
                        backgroundColor:
                          selectedImageIndex ===
                          index
                            ? accent
                            : "#D8C9B0",
                      }}
                    />
                  )
                )}
              </div>
            )}

            {/* ==================================================
                COLOR SWATCHES
                ================================================== */}

                   {hasColors &&
              !isTwoColorProduct &&
              !isScentVariantProduct && (
                <div className="mt-2">

                  <div className="mb-1">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color:
                          accent,
                      }}
                    >
                      Color
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {product.colors.map(
                      (
                        color,
                        index
                      ) => {
                      const swatchImg =
  color.options?.[0]?.image_url ??
  color.image_url ??
  color.image_urls?.[0];

                        const selected =
                          index ===
                          selectedColorIndex;

                        return (
                          <button
                            key={`${color.name}-${index}`}
                            type="button"
                            title={
                              color.name
                            }
                            aria-label={`Select ${color.name}`}
                                                        onClick={() => {
                              /*
                               * For Marble/Dimple/Iced Latte,
                               * clicking a swatch should scroll
                               * directly to that color's image —
                               * mark this as a sync-originated
                               * color change so the "reset gallery
                               * on color change" effect below
                               * doesn't immediately snap the
                               * scroll position back to 0 and
                               * undo it.
                               */
                              if (isColorScrollProduct) {
                                scrollSyncing.current = true;
                              }

                              setSelectedColorIndex(
                                index
                              );

                              setSelectedOptionIndex(
                                0
                              );

                              if (
                                isColorScrollProduct
                              ) {
                                const targetIndex =
                                  galleryItems.findIndex(
                                    (
                                      item
                                    ) =>
                                      item.colorIndex ===
                                      index
                                  );

                                if (
                                  targetIndex >=
                                  0
                                ) {
                                  requestAnimationFrame(
                                    () => {
                                      scrollToImage(
                                        targetIndex
                                      );
                                    }
                                  );
                                }
           } else {
  const targetIndex = galleryItems.findIndex(
    (item) => item.colorName === color.name
  );

  if (targetIndex >= 0) {
    requestAnimationFrame(() => {
      scrollToImage(targetIndex);
    });
  } else {
    setSelectedImageIndex(0);
    imageRefs.current = [];
  }
}
                            }}
                            className="relative h-12 w-12 overflow-hidden rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{
                              borderColor:
                                selected
                                  ? accent
                                  : "#FFF4E6",
                              backgroundColor:
                                color.hex ??
                                "#CCCCCC",
                              boxShadow:
                                selected
                                  ? `0 0 0 3px ${accent}30`
                                  : "0 2px 8px rgba(0,0,0,0.12)",
                            }}
                          >
                            {swatchImg && (
                              <img
                                src={
                                  swatchImg
                                }
                                alt={
                                  color.name
                                }
                                className="h-full w-full object-cover"
                              />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
                            

            {/* ==================================================
                RIBBON COLOR
                ================================================== */}

            {productName === "Tambourine" && (
  <div className="mt-5">
    <p
      className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ color: accent }}
    >
      Ribbon Color
    </p>

    <div className="flex items-center gap-3">
      <span
        className="h-8 w-8 flex-shrink-0 rounded-full"
        style={{
          backgroundColor: RIBBON_COLORS.find(
            (c) => c.id === selectedRibbon
          )!.hex,
          border: "1.5px solid rgba(0,0,0,0.15)",
          boxShadow:
            selectedRibbon === "gold"
              ? "inset 0 0 6px rgba(255,255,255,0.6)"
              : undefined,
        }}
      />

      <select
        value={selectedRibbon}
        onChange={(e) =>
          setSelectedRibbon(e.target.value as RibbonColorId)
        }
        className="flex-1 rounded-xl px-3 py-3 text-sm outline-none"
        style={{
          border: "1.5px solid rgba(0,0,0,0.15)",
          backgroundColor: "#FFFFFF",
          color: "#000000",
        }}
      >
        {RIBBON_COLORS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  </div>
)}

                      </section>

          {/* ================================================== */}
          {/* RIGHT */}
          {/* ================================================== */}

          <section className="flex flex-col lg:pt-6">
                        {hasOptions && !isTwoColorProduct && (
                           <div className="-mt-4 lg:mt-5">
                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {normalizedProductName === "plain candle" ? "Size" : "Style"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedColor!.options!.map((option, index) => {
                    const isSelected = index === selectedOptionIndex;

                    return (
                      <button
                        key={`${option.name}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedOptionIndex(index);
                          setSelectedImageIndex(0);
                          imageRefs.current = [];
                        }}
                        className="rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          backgroundColor: isSelected
                            ? accent
                            : "transparent",
                          color: isSelected ? "#FFF4E6" : "#000000",
                          borderColor: accent,
                        }}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

                       {(productName === "Tambourine" || product.description) && (
  <p
        className="mt-6 max-w-lg text-sm leading-7"
    style={{
      color:
        "rgba(0,0,0,0.62)",
    }}
  >
    {productName === "Tambourine"
      ? "A classic wooden tambourine with shiny silver jingles and a simple, timeless design. Perfect for weddings, celebrations, or as a decorative keepsake."
      : product.description}
  </p>
)}

            

            {/* ==================================================
                SCENT
                ================================================== */}

                                                  {!customizeOnly &&
  (!isGiveaway ||
    selectedOption?.name === "Scented" ||
    (isScentVariantProduct && selectedColor?.name === "Scented")) &&
  !isQuackAndKiss &&
  !isTwoColorProduct && (
                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{
                        color:
                          accent,
                      }}
                    >
                      Scent
                    </p>

                    <span className="text-xs font-semibold">
                      {selectedScent ??
                        "Unscented"}
                    </span>
                  </div>

                  {product.scents?.length >
                  0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {product.scents.map(
                        (
                          scent,
                          index
                        ) => {
                          const selected =
                            scent ===
                            selectedScent;

                          return (
                            <button
                              key={`${scent}-${index}`}
                              type="button"
                              onClick={() =>
                                setSelectedScent(
                                  scent
                                )
                              }
                              className="rounded-xl border px-3 py-3 text-xs font-medium transition-all hover:-translate-y-0.5"
                              style={{
                                backgroundColor:
                                  selected
                                    ? accent
                                    : "transparent",
                                color:
                                  selected
                                    ? "#FFF4E6"
                                    : "#000000",
                                borderColor:
                                  accent,
                              }}
                            >
                              {
                                scent
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <span
                      className="inline-block rounded-full px-4 py-2 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          "#EFE3C4",
                        color:
                          accent,
                      }}
                    >
                      Unscented
                    </span>
                  )}
                </div>
              )}

            {/* ==================================================
                NOOR COLORS
                ================================================== */}

            {!customizeOnly &&
              isTwoColorProduct && (
                <div className="mt-5">

                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color:
                        accent,
                    }}
                  >
                    Choose Your Colors
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                                           onClick={() => {
                        if (!selectedNoorWhite) {
                          setSelectedNoorWhite(true);
                          setNoorWhiteQuantity(1);

                         setOrderLines((prev) => [
                            ...prev,
                            {
                              id: `${product.id}-white`,
                              colorName: "White",
                              scentName: null,
                              price: Number(displayPrice),
                              quantity: 1,
                              image: gallery[0] ?? "",
                              inCart: false,
                            },
                          ]);
                        }
                      }}
                      className="rounded-2xl border px-4 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          selectedNoorWhite
                            ? "#FFFFFF"
                            : "transparent",
                        color:
                          "#000000",
                        borderColor:
                          selectedNoorWhite
                            ? "#000000"
                            : "#D8D8D8",
                      }}
                    >
                      White
                    </button>

                    <button
                      type="button"
                                            onClick={() => {
                        if (!selectedNoorGray) {
                          setSelectedNoorGray(true);
                          setNoorGrayQuantity(1);

                          setOrderLines((prev) => [
                            ...prev,
                            {
                              id: `${product.id}-gray`,
                              colorName: "Gray",
                              scentName: null,
                              price: Number(displayPrice),
                              quantity: 1,
                              image: gallery[0] ?? "",
                              inCart: false,
                            },
                          ]);
                        }
                      }}
                      className="rounded-2xl border px-4 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          selectedNoorGray
                            ? "#808080"
                            : "transparent",
                        color:
                          selectedNoorGray
                            ? "#FFFFFF"
                            : "#000000",
                        borderColor:
                          selectedNoorGray
                            ? "#606060"
                            : "#D8D8D8",
                      }}
                    >
                      Gray
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">

                    {selectedNoorWhite && (
                      <div
                        className="rounded-2xl p-3"
                        style={{
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-black/20"
                              style={{
                                backgroundColor:
                                  "#FFFFFF",
                              }}
                            />

                            <span className="text-sm font-semibold">
                              White
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateNoorQuantity(
                                  "White",
                                  noorWhiteQuantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              −
                            </button>

                            <span className="w-5 text-center text-sm font-semibold">
                              {
                                noorWhiteQuantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateNoorQuantity(
                                  "White",
                                  noorWhiteQuantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeNoorColor(
                                  "White"
                                )
                              }
                              className="ml-2 text-xs underline opacity-50 hover:opacity-100"
                            >
                              remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNoorGray && (
                      <div
                        className="rounded-2xl p-3"
                        style={{
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-black/20"
                              style={{
                                backgroundColor:
                                  "#808080",
                              }}
                            />

                            <span className="text-sm font-semibold">
                              Gray
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateNoorQuantity(
                                  "Gray",
                                  noorGrayQuantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              −
                            </button>

                            <span className="w-5 text-center text-sm font-semibold">
                              {
                                noorGrayQuantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateNoorQuantity(
                                  "Gray",
                                  noorGrayQuantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              +
                            </button>

                     <button
                              type="button"
                              onClick={() =>
                                removeNoorColor(
                                  "Gray"
                                )
                              }
                              className="ml-2 text-xs underline opacity-50 hover:opacity-100"
                            >
                              remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(selectedNoorWhite || selectedNoorGray) && (
                    <button
                      type="button"
                      onClick={addNoorOrderToCart}
                      className="mt-4 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                      style={{ backgroundColor: accent, color: "#FFF4E6" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = accentDark;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = accent;
                      }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              )}

            {/* ==================================================
                QUACK & KISS
                ================================================== */}

            {!customizeOnly &&
              isQuackAndKiss && (
                <div className="mt-5">

                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color:
                        accent,
                    }}
                  >
                    Choose Your Ducks
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                                       <button
                      type="button"
                      onClick={() => {
                        if (!selectedBride) {
                          addBrideToCart();
                        }
                      }}
                      className="rounded-2xl border px-4 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          selectedBride
                            ? "#D8A1AF"
                            : "transparent",
                        color:
                          selectedBride
                            ? "#FFF4E6"
                            : "#000000",
                        borderColor:
                          selectedBride
                            ? "#D8A1AF"
                            : "#D8D8D8",
                      }}
                    >
                      Bride Duck
                    </button>

                                       <button
                      type="button"
                      onClick={() => {
                        if (!selectedGroom) {
                          addGroomToCart();
                        }
                      }}
                      className="rounded-2xl border px-4 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          selectedGroom
                            ? "#6E86C7"
                            : "transparent",
                        color:
                          selectedGroom
                            ? "#FFF4E6"
                            : "#000000",
                        borderColor:
                          selectedGroom
                            ? "#6E86C7"
                            : "#D8D8D8",
                      }}
                    >
                      Groom Duck
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">

                    {selectedBride && (
                      <div
                        className="rounded-2xl p-3"
                        style={{
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor:
                                  "#D8A1AF",
                              }}
                            />

                            <span className="text-sm font-semibold">
                              Bride Duck
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateDuckQuantity(
                                  "Bride",
                                  brideQuantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              −
                            </button>

                            <span className="w-5 text-center text-sm font-semibold">
                              {
                                brideQuantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateDuckQuantity(
                                  "Bride",
                                  brideQuantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeDuck(
                                  "Bride"
                                )
                              }
                              className="ml-2 text-xs underline opacity-50 hover:opacity-100"
                            >
                              remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedGroom && (
                      <div
                        className="rounded-2xl p-3"
                        style={{
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor:
                                  "#6E86C7",
                              }}
                            />

                            <span className="text-sm font-semibold">
                              Groom Duck
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateDuckQuantity(
                                  "Groom",
                                  groomQuantity -
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              −
                            </button>

                            <span className="w-5 text-center text-sm font-semibold">
                              {
                                groomQuantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateDuckQuantity(
                                  "Groom",
                                  groomQuantity +
                                    1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeDuck(
                                  "Groom"
                                )
                              }
                              className="ml-2 text-xs underline opacity-50 hover:opacity-100"
                            >
                              remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* ==================================================
                POCKET HEARTS — PERSONALIZATION (optional)
                ================================================== */}

               {(productName === "Pocket Hearts" || productName === "Rustic Warmth") && (
              <div className="mt-5">
                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  Personalize (Optional)
                </p>

                              <p
                  className="mb-3 text-xs"
                  style={{ color: "rgba(0,0,0,0.55)" }}
                >
                  Add your initials like in the example photo. Type them, or upload an image if you'd
                  like a specific lettering style.
                </p>

                <input
                  value={monogramText}
                  onChange={(e) => {
                    // Keep this to initials only — two letters with
                    // "&" between them, e.g. "S & H".
                    const raw = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z&\s]/g, "");
                    setMonogramText(raw.slice(0, 6));
                  }}
                  placeholder="e.g. S & H"
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    border: "1.5px solid rgba(0,0,0,0.15)",
                    backgroundColor: "#FFFFFF",
                    color: "#000000",
                  }}
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      monogramFileInputRef.current?.click()
                    }
                    className="flex-1 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: accent,
                      color: "#000000",
                    }}
                  >
                    {monogramImageUrl
                      ? "Image added — tap to change"
                      : "Or upload an image instead"}
                  </button>

                  {monogramImageUrl && (
                    <img
                      src={monogramImageUrl}
                      alt="Your uploaded lettering"
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                      style={{ border: `1px solid ${accent}` }}
                    />
                  )}
                </div>

                <input
                  ref={monogramFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleMonogramImageChange}
                />
              </div>
            )}

            {/* ==================================================
                REGULAR ADD TO CART
                ================================================== */}

                       {!customizeOnly &&
  (!isGiveaway || isPlainSellableGiveaway) &&
  !isQuackAndKiss &&
  !isTwoColorProduct &&
  productName !== "Tambourine" && (
    <>
      <button
        type="button"
        onClick={addRegularProductToCart}
        className="mt-6 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        style={{ backgroundColor: accent, color: "#FFF4E6" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = accentDark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = accent;
        }}
           >
        Add to Cart
      </button>

      {!hasNoOrderCounter && orderLines.length > 0 && (
        <div className="mt-5">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            Your Order
          </p>

          <div className="flex flex-col gap-2">
            {orderLines.map((line, index) => (
              <div
                key={`order-${line.id}-${index}`}
                className="rounded-2xl p-3"
                style={{ backgroundColor: "#EFE3C4" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{line.colorName}</p>
                    {line.scentName && (
                      <p className="mt-1 text-xs opacity-55">{line.scentName}</p>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateNormalLineQuantity(line.id, line.quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                    >
                      −
                    </button>

                    <span className="w-5 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateNormalLineQuantity(line.id, line.quantity + 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                    >
                      +
                    </button>

                    <span
                      className="ml-2 min-w-[70px] text-right text-sm font-bold"
                      style={{ color: accent }}
                    >
                      {line.price * line.quantity} EGP
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="text-xs underline opacity-50 hover:opacity-100"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )}

{/* ==================================================
    TAMBOURINE PLAIN — STACKABLE ORDER (size + ribbon)
    ================================================== */}
{!customizeOnly && productName === "Tambourine" && (
  <>
    <div
      className="mt-6 flex items-center gap-2 rounded-full px-4 py-2 w-fit"
      style={{ backgroundColor: `${accent}1A` }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-[0.15em]"
        style={{ color: accent }}
      >
        Plain Tambourine
      </span>
    </div>

    <div className="mt-4">
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        Quantity
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setPlainQuantity((q) => Math.max(1, q - 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold transition-all hover:scale-105 active:scale-95"
        >
          −
        </button>

        <span className="w-6 text-center text-sm font-semibold">
          {plainQuantity}
        </span>

        <button
          type="button"
          onClick={() => setPlainQuantity((q) => q + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold transition-all hover:scale-105 active:scale-95"
        >
          +
        </button>
      </div>
    </div>

    {/* PRIMARY ACTION 1 — stack this size+ribbon combo */}
    <button
      type="button"
      onClick={addTambourineLineToOrder}
      className="mt-4 w-full rounded-full border-2 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "transparent",
        borderColor: accent,
        color: accent,
      }}
    >
      + Add to Order
    </button>

    {orderLines.length > 0 && (
      <div className="mt-5">
        <p
          className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Your Order
        </p>

        <div className="flex flex-col gap-2">
          {orderLines.map((line, index) => (
            <div
              key={`tamb-order-${line.id}-${index}`}
              className="rounded-2xl p-3"
              style={{ backgroundColor: "#EFE3C4" }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm font-semibold">
                  {line.colorName}
                </p>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateTambourineLineQuantity(line.id, line.quantity - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                  >
                    −
                  </button>

                  <span className="w-5 text-center text-sm font-semibold">
                    {line.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateTambourineLineQuantity(line.id, line.quantity + 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                  >
                    +
                  </button>

                  <span
                    className="ml-2 min-w-[70px] text-right text-sm font-bold"
                    style={{ color: accent }}
                  >
                    {line.price * line.quantity} EGP
                  </span>
                </div>
              </div>

              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={() => removeTambourineLine(line.id)}
                  className="text-xs underline opacity-50 hover:opacity-100"
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ border: `1px solid ${accent}` }}
        >
          <span className="text-sm font-semibold">
            {totalQuantity} tambourine{totalQuantity !== 1 ? "s" : ""} total
          </span>
          <span className="text-lg font-bold" style={{ color: accent }}>
            {totalOrderPrice} EGP
          </span>
        </div>

        {/* PRIMARY ACTION 2 — commit the whole stacked order */}
        <button
          type="button"
          onClick={addTambourineOrderToCart}
          className="mt-4 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ backgroundColor: accent, color: "#FFF4E6" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = accentDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = accent;
          }}
        >
          Add Order to Cart
        </button>
      </div>
    )}
  </>
)}
            {/* ==================================================
                QUACK ADD TO CART
                ================================================== */}

            {isQuackAndKiss &&
              (selectedBride ||
                selectedGroom) && (
                <button
                  type="button"
                  onClick={
                    addQuackAndKissToCart
                  }
                  className="mt-3 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                  style={{
                    backgroundColor:
                      accent,
                    color:
                      "#FFF4E6",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      accentDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      accent;
                  }}
                >
                  Add to Cart
                </button>
              )}

            {/* ==================================================
                TOTAL
                ================================================== */}

            {(isTwoColorProduct ||
              isQuackAndKiss) &&
              orderLines.length >
                0 && (
                <div
                  className="mt-4 flex items-center justify-between rounded-2xl px-5 py-4"
                  style={{
                    backgroundColor:
                      "transparent",
                    border: `1px solid ${accent}`,
                  }}
                >
                  <span className="text-sm font-semibold">
                    {
                      totalQuantity
                    }{" "}
                    item
                    {totalQuantity !==
                    1
                      ? "s"
                      : ""}{" "}
                    total
                  </span>

                  <span
                    className="text-lg font-bold"
                    style={{
                      color:
                        accent,
                    }}
                  >
                    {
                      totalOrderPrice
                    }{" "}
                    EGP
                  </span>
                </div>
              )}

            {/* ==================================================
                CUSTOMIZE
                ================================================== */}

            {customizeRoute && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    customizeRoute
                  )
                }
                className="mt-3 w-full rounded-full border px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor:
                    "transparent",
                  color: accent,
                  borderColor:
                    accent,
                }}
              >
                Customize Your{" "}
                {productName}
              </button>
            )}

            <div
              className="mt-6 grid grid-cols-2 gap-5 border-t pt-5"
              style={{
                borderColor:
                  "#D8C9B0",
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}