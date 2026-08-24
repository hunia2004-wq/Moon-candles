"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/lib/supabase/types";

type OrderLine = {
  id: string;
  colorName: string;
  scentName: string | null;
  price: number;
  quantity: number;
  image: string;
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

/*
 * ============================================================
 * PRODUCTS WHOSE COLORS SHOULD BE SWIPED IN THE GALLERY
 * ============================================================
 *
 * These products have one/more images per color, and the
 * horizontal gallery should move through the COLORS themselves.
 */
const COLOR_SCROLL_PRODUCTS = [
  "Marble",
  "Dimple",
  "Iced Latte",
];

const QUACK_IMAGES = {
  combo:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/bride%20and%20groom%20duck.png",

  bride:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/bride%20duck.png",

  groom:
    "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/groom%20duck.png",
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
   */

  useEffect(() => {
    if (!product.colors?.length) {
      return;
    }

    const colorFromUrl =
      searchParams.get("color");

    if (!colorFromUrl) {
      return;
    }

    const foundIndex =
      product.colors.findIndex(
        (color) =>
          color.name?.toLowerCase() ===
          colorFromUrl.toLowerCase()
      );

    if (
      foundIndex >= 0 &&
      foundIndex !==
        selectedColorIndex
    ) {
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
    selectedColorIndex,
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

      if (selectedColor) {
        if (
          hasOptions &&
          selectedOption
        ) {
          addImages(
            selectedOption.image_urls,
            selectedColor.name,
            selectedColorIndex
          );

          addImage(
            selectedOption.image_url,
            selectedColor.name,
            selectedColorIndex
          );
        }

        addImages(
          selectedColor.image_urls,
          selectedColor.name,
          selectedColorIndex
        );

        addImage(
          selectedColor.image_url,
          selectedColor.name,
          selectedColorIndex
        );

        selectedColor.options?.forEach(
          (
            option,
            optionIndex
          ) => {
            if (
              hasOptions &&
              optionIndex ===
                selectedOptionIndex
            ) {
              return;
            }

            addImages(
              option.image_urls,
              selectedColor.name,
              selectedColorIndex
            );

            addImage(
              option.image_url,
              selectedColor.name,
              selectedColorIndex
            );
          }
        );

        if (items.length === 0) {
          addImages(
            product.image_urls,
            selectedColor.name,
            selectedColorIndex
          );
        }
      }

      if (!selectedColor) {
        addImages(
          product.image_urls,
          null,
          -1
        );
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
        setSelectedColorIndex(
          galleryColorIndex
        );

        setSelectedOptionIndex(0);
      }
    }
  }

  /*
   * ============================================================
   * HANDLE GALLERY SCROLL
   * ============================================================
   */

  function handleGalleryScroll() {
    const container =
      imageScrollRef.current;

    if (
      !container ||
      gallery.length <= 1
    ) {
      return;
    }

    const containerCenter =
      container.scrollLeft +
      container.clientWidth /
        2;

    let closestIndex = 0;

    let closestDistance =
      Infinity;

    imageRefs.current.forEach(
      (
        slide,
        index
      ) => {
        if (!slide) return;

        const slideCenter =
          slide.offsetLeft +
          slide.clientWidth /
            2;

        const distance =
          Math.abs(
            slideCenter -
              containerCenter
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance =
            distance;

          closestIndex =
            index;
        }
      }
    );

    if (
      closestIndex !==
      selectedImageIndex
    ) {
      setSelectedImageIndex(
        closestIndex
      );
    }

    /*
     * ========================================================
     * THIS IS THE KEY FIX.
     *
     * When the user physically swipes to another image,
     * determine which color that image belongs to.
     * ========================================================
     */
    if (
      isColorScrollProduct
    ) {
      const item =
        galleryItems[
          closestIndex
        ];

      if (
        item &&
        item.colorIndex >= 0 &&
        item.colorIndex !==
          selectedColorIndex
      ) {
        setSelectedColorIndex(
          item.colorIndex
        );

        setSelectedOptionIndex(0);
      }
    }
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
                "Bride"
          );

        const groomItem =
          existingCart.find(
            (item: any) =>
              item.productId ===
                product.id &&
              item.productName ===
                productName &&
              item.color ===
                "Groom"
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
    setSelectedOptionIndex(0);

    /*
     * This is intentionally disabled for the three
     * color-scroll products.
     */
    if (
      !isColorScrollProduct
    ) {
      setSelectedImageIndex(0);

      imageRefs.current = [];

      requestAnimationFrame(() => {
        imageScrollRef.current?.scrollTo({
          left: 0,
          behavior: "auto",
        });
      });
    }
  }, [
    selectedColorIndex,
    isColorScrollProduct,
  ]);

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
    selectedColorIndex,
    selectedImageIndex,
  ]);

  /*
   * ============================================================
   * NOOR EL QAMAR
   * ============================================================
   */

  function addNoorWhiteToCart() {
    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const existingIndex =
      existingCart.findIndex(
        (item: any) =>
          item.productId ===
            product.id &&
          item.productName ===
            productName &&
          item.color ===
            "White"
      );

    const newItem = {
      id: `${product.id}-white`,
      productId: product.id,
      productName,
      price: Number(
        displayPrice
      ),
      quantity:
        noorWhiteQuantity,
      scent: null,
      color: "White",
      image:
        gallery[0] ?? "",
    };

    const updatedCart = [
      ...existingCart,
    ];

    if (
      existingIndex !== -1
    ) {
      updatedCart[
        existingIndex
      ] = {
        ...updatedCart[
          existingIndex
        ],
        ...newItem,
      };
    } else {
      updatedCart.push(
        newItem
      );
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setSelectedNoorWhite(
      true
    );

    setOrderLines((prev) => {
      const id = `${product.id}-white`;

      const existingLineIndex =
        prev.findIndex(
          (line) =>
            line.id === id
        );

      if (
        existingLineIndex !== -1
      ) {
        const updated = [
          ...prev,
        ];

        updated[
          existingLineIndex
        ] = {
          ...updated[
            existingLineIndex
          ],
          quantity:
            noorWhiteQuantity,
        };

        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "White",
          scentName: null,
          price: Number(
            displayPrice
          ),
          quantity:
            noorWhiteQuantity,
          image:
            gallery[0] ?? "",
        },
      ];
    });
  }

  function addNoorGrayToCart() {
    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const existingIndex =
      existingCart.findIndex(
        (item: any) =>
          item.productId ===
            product.id &&
          item.productName ===
            productName &&
          item.color ===
            "Gray"
      );

    const newItem = {
      id: `${product.id}-gray`,
      productId: product.id,
      productName,
      price: Number(
        displayPrice
      ),
      quantity:
        noorGrayQuantity,
      scent: null,
      color: "Gray",
      image:
        gallery[0] ?? "",
    };

    const updatedCart = [
      ...existingCart,
    ];

    if (
      existingIndex !== -1
    ) {
      updatedCart[
        existingIndex
      ] = {
        ...updatedCart[
          existingIndex
        ],
        ...newItem,
      };
    } else {
      updatedCart.push(
        newItem
      );
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setSelectedNoorGray(
      true
    );

    setOrderLines((prev) => {
      const id = `${product.id}-gray`;

      const existingLineIndex =
        prev.findIndex(
          (line) =>
            line.id === id
        );

      if (
        existingLineIndex !== -1
      ) {
        const updated = [
          ...prev,
        ];

        updated[
          existingLineIndex
        ] = {
          ...updated[
            existingLineIndex
          ],
          quantity:
            noorGrayQuantity,
        };

        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Gray",
          scentName: null,
          price: Number(
            displayPrice
          ),
          quantity:
            noorGrayQuantity,
          image:
            gallery[0] ?? "",
        },
      ];
    });
  }

  function removeNoorColor(
    color: "White" | "Gray"
  ) {
    const id = `${product.id}-${color.toLowerCase()}`;

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

    if (color === "White") {
      setSelectedNoorWhite(
        false
      );
      setNoorWhiteQuantity(1);
    }

    if (color === "Gray") {
      setSelectedNoorGray(
        false
      );
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

    const safeQuantity =
      Math.max(
        1,
        newQuantity
      );

    const id = `${product.id}-${color.toLowerCase()}`;

    if (color === "White") {
      setNoorWhiteQuantity(
        safeQuantity
      );
    } else {
      setNoorGrayQuantity(
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
   * QUACK & KISS
   * ============================================================
   */

  function addBrideToCart() {
    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const existingIndex =
      existingCart.findIndex(
        (item: any) =>
          item.productId ===
            product.id &&
          item.productName ===
            productName &&
          item.color ===
            "Bride"
      );

    const newItem = {
      id: `${product.id}-bride`,
      productId: product.id,
      productName,
      price: Number(
        displayPrice
      ),
      quantity:
        brideQuantity,
      scent: null,
      color: "Bride",
      image:
        QUACK_IMAGES.bride,
    };

    const updatedCart = [
      ...existingCart,
    ];

    if (
      existingIndex !== -1
    ) {
      updatedCart[
        existingIndex
      ] = {
        ...updatedCart[
          existingIndex
        ],
        ...newItem,
      };
    } else {
      updatedCart.push(
        newItem
      );
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setSelectedBride(true);

    setOrderLines((prev) => {
      const id = `${product.id}-bride`;

      const existingLineIndex =
        prev.findIndex(
          (line) =>
            line.id === id
        );

      if (
        existingLineIndex !== -1
      ) {
        const updated = [
          ...prev,
        ];

        updated[
          existingLineIndex
        ] = {
          ...updated[
            existingLineIndex
          ],
          quantity:
            brideQuantity,
        };

        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Bride",
          scentName: null,
          price: Number(
            displayPrice
          ),
          quantity:
            brideQuantity,
          image:
            QUACK_IMAGES.bride,
        },
      ];
    });
  }

  function addGroomToCart() {
    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const existingIndex =
      existingCart.findIndex(
        (item: any) =>
          item.productId ===
            product.id &&
          item.productName ===
            productName &&
          item.color ===
            "Groom"
      );

    const newItem = {
      id: `${product.id}-groom`,
      productId: product.id,
      productName,
      price: Number(
        displayPrice
      ),
      quantity:
        groomQuantity,
      scent: null,
      color: "Groom",
      image:
        QUACK_IMAGES.groom,
    };

    const updatedCart = [
      ...existingCart,
    ];

    if (
      existingIndex !== -1
    ) {
      updatedCart[
        existingIndex
      ] = {
        ...updatedCart[
          existingIndex
        ],
        ...newItem,
      };
    } else {
      updatedCart.push(
        newItem
      );
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setSelectedGroom(true);

    setOrderLines((prev) => {
      const id = `${product.id}-groom`;

      const existingLineIndex =
        prev.findIndex(
          (line) =>
            line.id === id
        );

      if (
        existingLineIndex !== -1
      ) {
        const updated = [
          ...prev,
        ];

        updated[
          existingLineIndex
        ] = {
          ...updated[
            existingLineIndex
          ],
          quantity:
            groomQuantity,
        };

        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Groom",
          scentName: null,
          price: Number(
            displayPrice
          ),
          quantity:
            groomQuantity,
          image:
            QUACK_IMAGES.groom,
        },
      ];
    });
  }

  function addQuackAndKissToCart() {
    if (selectedBride) {
      addBrideToCart();
    }

    if (selectedGroom) {
      addGroomToCart();
    }
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
   * REGULAR CART
   * ============================================================
   */

  function addRegularProductToCart() {
    const existingCart =
      JSON.parse(
        localStorage.getItem(
          "cart"
        ) || "[]"
      );

    const productColor =
      selectedColor?.name ??
      productName;

    const productScent =
      selectedScent ?? null;

    const lineId =
      createLineId(
        productColor,
        productScent
      );

    const existingIndex =
      existingCart.findIndex(
        (item: any) =>
          item.productId ===
            product.id &&
          item.productName ===
            productName &&
          (item.color ??
            productName) ===
            productColor &&
          (item.scent ?? null) ===
            productScent
      );

    const newQuantity =
      existingIndex !== -1
        ? Number(
            existingCart[
              existingIndex
            ].quantity
          ) || 1
        : 1;

    const newItem = {
      id: lineId,
      productId:
        product.id,
      productName,
      price: Number(
        displayPrice
      ),
      quantity:
        newQuantity,
      scent:
        productScent,
      color:
        productColor,
      image:
        gallery[0] ?? "",
    };

    const updatedCart = [
      ...existingCart,
    ];

    if (
      existingIndex !== -1
    ) {
      updatedCart[
        existingIndex
      ] = {
        ...updatedCart[
          existingIndex
        ],
        ...newItem,
      };
    } else {
      updatedCart.push(
        newItem
      );
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setOrderLines((prev) => {
      const existingLineIndex =
        prev.findIndex(
          (line) =>
            line.id === lineId
        );

      if (
        existingLineIndex !== -1
      ) {
        const updated = [
          ...prev,
        ];

        updated[
          existingLineIndex
        ] = {
          ...updated[
            existingLineIndex
          ],
          colorName:
            productColor,
          scentName:
            productScent,
          price: Number(
            displayPrice
          ),
          quantity:
            newQuantity,
          image:
            gallery[0] ?? "",
        };

        return updated;
      }

      return [
        ...prev,
        {
          id: lineId,
          colorName:
            productColor,
          scentName:
            productScent,
          price: Number(
            displayPrice
          ),
          quantity:
            newQuantity,
          image:
            gallery[0] ?? "",
        },
      ];
    });
  }

  function updateNormalLineQuantity(
    lineId: string,
    newQuantity: number
  ) {
    if (newQuantity <= 0) {
      removeLine(lineId);
      return;
    }

    const safeQuantity =
      Math.max(
        1,
        newQuantity
      );

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId
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
          item.id === lineId
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

  function removeLine(
    id: string
  ) {
    setOrderLines((prev) =>
      prev.filter(
        (line) =>
          line.id !== id
      )
    );

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
                        className="flex h-full w-full flex-shrink-0 snap-center snap-always items-center justify-center px-4 py-2 md:px-8"
                        style={{
                          scrollSnapAlign:
                            "center",
                        }}
                      >
                        <img
                          src={url}
                          alt={`${productName} ${
                            galleryColorNames[
                              index
                            ] ?? ""
                          } image ${
                            index + 1
                          }`}
                          className="h-full w-full select-none object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.10)]"
                          draggable={
                            false
                          }
                        />
                      </div>
                    )
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm opacity-40">
                    No image available
                  </div>
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={
                        previousImage
                      }
                      aria-label="Previous image"
                      className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-[#EFE3C4]/90 backdrop-blur transition-all hover:-translate-x-1 md:flex"
                      style={{
                        borderColor:
                          "#D8C9B0",
                      }}
                    >
                      <ChevronLeft
                        size={19}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        nextImage
                      }
                      aria-label="Next image"
                      className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-[#EFE3C4]/90 backdrop-blur transition-all hover:translate-x-1 md:flex"
                      style={{
                        borderColor:
                          "#D8C9B0",
                      }}
                    >
                      <ChevronRight
                        size={19}
                      />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ==================================================
                ACTIVE COLOR
                ================================================== */}

            {hasColors &&
              activeGalleryColor && (
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
                      activeGalleryColor
                    }
                  </span>
                </div>
              )}

            {/* ==================================================
                PRODUCT TITLE
                ================================================== */}

            <div className="mt-3 flex flex-col items-center text-center">

              <p
                className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: accent,
                }}
              >
                Handpoured With Love
              </p>

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

                {product.size_ml && (
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
                        {
                          product.size_ml
                        }{" "}
                        ml
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
              !isTwoColorProduct && (
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
                          color
                            .options?.[0]
                            ?.image_url ??
                          color.image_url;

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
                              setSelectedColorIndex(
                                index
                              );

                              setSelectedOptionIndex(
                                0
                              );

                              /*
                               * For Marble/Dimple/Iced Latte,
                               * clicking a swatch should scroll
                               * directly to that color's image.
                               */
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
                                setSelectedImageIndex(
                                  0
                                );

                                imageRefs.current =
                                  [];
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
                OPTIONS
                ================================================== */}

            {hasOptions &&
              !isTwoColorProduct && (
                <div className="mt-5">

                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color:
                        accent,
                    }}
                  >
                    Style
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedColor!.options!.map(
                      (
                        option,
                        index
                      ) => {
                        const isSelected =
                          index ===
                          selectedOptionIndex;

                        return (
                          <button
                            key={`${option.name}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedOptionIndex(
                                index
                              );

                              setSelectedImageIndex(
                                0
                              );

                              imageRefs.current =
                                [];
                            }}
                            className="rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                              backgroundColor:
                                isSelected
                                  ? accent
                                  : "transparent",
                              color:
                                isSelected
                                  ? "#FFF4E6"
                                  : "#000000",
                              borderColor:
                                accent,
                            }}
                          >
                            {
                              option.name
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
          </section>

          {/* ================================================== */}
          {/* RIGHT */}
          {/* ================================================== */}

          <section className="flex flex-col lg:pt-6">

            {product.description && (
              <p
                className="mt-1 max-w-lg text-sm leading-7"
                style={{
                  color:
                    "rgba(0,0,0,0.62)",
                }}
              >
                {
                  product.description
                }
              </p>
            )}

            {/* ==================================================
                SCENT
                ================================================== */}

            {!customizeOnly &&
              !isGiveaway &&
              !isTwoColorProduct &&
              !isQuackAndKiss && (
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
                        if (
                          !selectedNoorWhite
                        ) {
                          addNoorWhiteToCart();
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
                        if (
                          !selectedNoorGray
                        ) {
                          addNoorGrayToCart();
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
                        if (
                          !selectedBride
                        ) {
                          setSelectedBride(
                            true
                          );

                          setBrideQuantity(
                            1
                          );
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
                        if (
                          !selectedGroom
                        ) {
                          setSelectedGroom(
                            true
                          );

                          setGroomQuantity(
                            1
                          );
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
                REGULAR ADD TO CART
                ================================================== */}

            {!customizeOnly &&
              !isGiveaway &&
              !isQuackAndKiss &&
              !isTwoColorProduct && (
                <>
                  <button
                    type="button"
                    onClick={
                      addRegularProductToCart
                    }
                    className="mt-6 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
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

                  {orderLines.length >
                    0 && (
                    <div className="mt-5">

                      <p
                        className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{
                          color:
                            accent,
                        }}
                      >
                        Your Order
                      </p>

                      <div className="flex flex-col gap-2">

                        {orderLines.map(
                          (
                            line,
                            index
                          ) => (
                            <div
                              key={`order-${line.id}-${index}`}
                              className="rounded-2xl p-3"
                              style={{
                                backgroundColor:
                                  "#EFE3C4",
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">
                                    {
                                      line.colorName
                                    }
                                  </p>

                                  {line.scentName && (
                                    <p className="mt-1 text-xs opacity-55">
                                      {
                                        line.scentName
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateNormalLineQuantity(
                                        line.id,
                                        line.quantity -
                                          1
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                                  >
                                    −
                                  </button>

                                  <span className="w-5 text-center text-sm font-semibold">
                                    {
                                      line.quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateNormalLineQuantity(
                                        line.id,
                                        line.quantity +
                                          1
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                                  >
                                    +
                                  </button>

                                  <span
                                    className="ml-2 min-w-[70px] text-right text-sm font-bold"
                                    style={{
                                      color:
                                        accent,
                                    }}
                                  >
                                    {line.price *
                                      line.quantity}{" "}
                                    EGP
                                  </span>
                                </div>
                              </div>

                              <div className="mt-1 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeLine(
                                      line.id
                                    )
                                  }
                                  className="text-xs underline opacity-50 hover:opacity-100"
                                >
                                  remove
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
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