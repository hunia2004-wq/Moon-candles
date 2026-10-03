"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import {
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/cart";
import { uploadCustomerImage } from "@/lib/uploadCustomerImage";

type OrderLine = {
  id: string;
  colorName: string;
  optionName: string;
  price: number;
  quantity: number;
  image: string;
  photoUrlFront?: string;
  photoUrlBack?: string;
};

const ACCENT = "#6E86C7";
const ACCENT_DARK = "#5A70B0";
const CREAM = "#FFF4E6";
const SAND = "#EFE3C4";
const SAND_BORDER = "#D8C9B0";

const BLOOM_WAND_WITH_PHOTO_IMAGES = [
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/wand%20with%20pic%201.jpg",
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/wand%20with%20pic%202.jpg",
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/giveaways%20moon/wand%20with%20pic%203.jpg",
];

export default function BloomWandBuilder({
  product,
}: {
  product: Product;
}) {
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
      : "Bloom Wand";

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [selectedColorIndex, setSelectedColorIndex] =
    useState(0);

  const [selectedOptionIndex, setSelectedOptionIndex] =
    useState(0);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [quantity, setQuantity] = useState(1);

  const [orderLines, setOrderLines] =
    useState<OrderLine[]>([]);

  const [frontPhotoUrl, setFrontPhotoUrl] =
    useState<string | null>(null);
const [uploadingFront, setUploadingFront] = useState(false);
const [uploadingBack, setUploadingBack] = useState(false);
  const [backPhotoUrl, setBackPhotoUrl] =
    useState<string | null>(null);

  const imageScrollRef =
    useRef<HTMLDivElement>(null);

  const imageRefs =
    useRef<(HTMLDivElement | null)[]>([]);

  const frontFileInputRef =
    useRef<HTMLInputElement>(null);

  const backFileInputRef =
    useRef<HTMLInputElement>(null);

  const committedLineIds =
    useRef<Set<string>>(new Set());

  const scrollSyncing =
    useRef(false);

  // IMPORTANT:
  // Prevents the normal scroll listener from fighting
  // with arrow/button navigation.
  const programmaticScroll =
    useRef(false);

  const colors =
    product.colors ?? [];

  const selectedColor =
    colors[selectedColorIndex];

  const selectedOption =
    selectedColor?.options?.[
      selectedOptionIndex
    ];

  const isWithPhoto =
    selectedOption?.name?.toLowerCase() ===
    "with photo";

  /*
   * ============================================================
   * GALLERY
   * ============================================================
   */

  const withoutPhotoOption =
    selectedColor?.options?.find(
      (o) => o.name === "Without Photo"
    );

  const colorOwnImages =
    selectedColor?.image_urls?.length
      ? selectedColor.image_urls
      : selectedColor?.image_url
      ? [selectedColor.image_url]
      : withoutPhotoOption?.image_urls?.length
      ? withoutPhotoOption.image_urls
      : withoutPhotoOption?.image_url
      ? [withoutPhotoOption.image_url]
      : [];

  const colorHasOwnImage =
    colorOwnImages.length > 0;

  type GalleryItem = {
    url: string;
    colorIndex: number;
  };

  const galleryItems: GalleryItem[] =
    !isWithPhoto
      ? colors.flatMap(
          (color, colorIndex) => {
            const matchingOption =
              color.options?.find(
                (o) =>
                  o.name ===
                  selectedOption?.name
              ) ??
              color.options?.[0];

            const urls =
              matchingOption?.image_urls?.length
                ? matchingOption.image_urls
                : matchingOption?.image_url
                ? [matchingOption.image_url]
                : color.image_urls?.length
                ? color.image_urls
                : color.image_url
                ? [color.image_url]
                : [];

            return urls.map((url) => ({
              url,
              colorIndex,
            }));
          }
        )
      : (
          colorHasOwnImage
            ? [
                ...colorOwnImages,
                ...BLOOM_WAND_WITH_PHOTO_IMAGES,
              ]
            : BLOOM_WAND_WITH_PHOTO_IMAGES
        ).map((url) => ({
          url,
          colorIndex:
            selectedColorIndex,
        }));

  const gallery =
    galleryItems.map(
      (item) => item.url
    );

  const previewImage =
    gallery[selectedImageIndex] ??
    gallery[0] ??
    "";

  /*
   * ============================================================
   * CART SYNC
   * ============================================================
   */

  useEffect(() => {
    function syncOrderWithCart() {
      const cart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

      const cartIds = new Set(
        cart.map(
          (item: any) => item.id
        )
      );

      const committedSnapshot =
        new Set(
          committedLineIds.current
        );

      setOrderLines((prev) =>
        prev
          .filter(
            (line) =>
              cartIds.has(line.id) ||
              !committedSnapshot.has(
                line.id
              )
          )
          .map((line) => {
            const cartMatch =
              cart.find(
                (item: any) =>
                  item.id === line.id
              );

            return cartMatch
              ? {
                  ...line,
                  quantity:
                    cartMatch.quantity,
                }
              : line;
          })
      );

      committedSnapshot.forEach(
        (id) => {
          if (!cartIds.has(id)) {
            committedLineIds.current.delete(
              id
            );
          }
        }
      );
    }

    window.addEventListener(
      "cartUpdated",
      syncOrderWithCart
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        syncOrderWithCart
      );
    };
  }, []);

  /*
   * ============================================================
   * REHYDRATE CART
   * ============================================================
   */

  useEffect(() => {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingLines: OrderLine[] =
      cart
        .filter(
          (item: any) =>
            item.productId === product.id
        )
        .map((item: any) => ({
          id: item.id,
          colorName:
            item.color ?? "",
          optionName:
            item.option ?? "",
          price:
            Number(item.price) || 0,
          quantity:
            Number(item.quantity) || 1,
          image:
            item.image ?? "",
          photoUrlFront:
            item.photoUrlFront ??
            undefined,
          photoUrlBack:
            item.photoUrlBack ??
            undefined,
        }));

    if (
      existingLines.length > 0
    ) {
      setOrderLines((prev) => {
        const existingIds =
          new Set(
            prev.map(
              (l) => l.id
            )
          );

        return [
          ...prev,
          ...existingLines.filter(
            (l) =>
              !existingIds.has(
                l.id
              )
          ),
        ];
      });

      existingLines.forEach(
        (line) => {
          committedLineIds.current.add(
            line.id
          );
        }
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ============================================================
   * RESET GALLERY
   * ============================================================
   */

  useEffect(() => {
    /*
     * When the gallery itself changes color because
     * of scrolling, don't reset it back to image 0.
     */
    if (scrollSyncing.current) {
      scrollSyncing.current = false;
      return;
    }

    /*
     * If an arrow/button is currently controlling
     * the gallery, don't let this effect fight it.
     */
    if (programmaticScroll.current) {
      return;
    }

    setSelectedImageIndex(0);

    requestAnimationFrame(() => {
      imageScrollRef.current?.scrollTo({
        left: 0,
        behavior: "auto",
      });
    });
  }, [
    selectedColorIndex,
    selectedOptionIndex,
  ]);

  /*
   * ============================================================
   * COLOR CHANGE
   * ============================================================
   */

  function handleColorChange(
    index: number
  ) {
    const currentOptionName =
      selectedColor?.options?.[
        selectedOptionIndex
      ]?.name;

    if (!isWithPhoto) {
      scrollSyncing.current =
        true;
    }

    setSelectedColorIndex(index);

    const newOptionIndex =
      colors[index]?.options?.findIndex(
        (option) =>
          option.name ===
          currentOptionName
      );

    if (
      newOptionIndex !==
        undefined &&
      newOptionIndex >= 0
    ) {
      setSelectedOptionIndex(
        newOptionIndex
      );
    } else {
      setSelectedOptionIndex(0);
    }

    if (isWithPhoto) {
      setSelectedImageIndex(0);
    } else {
      const targetIndex =
        galleryItems.findIndex(
          (item) =>
            item.colorIndex ===
            index
        );

      if (targetIndex >= 0) {
        requestAnimationFrame(() => {
          scrollToImage(
            targetIndex
          );
        });
      }
    }
  }

  /*
   * ============================================================
   * OPTION CHANGE
   * ============================================================
   */

  function handleOptionChange(
    index: number
  ) {
    setSelectedOptionIndex(
      index
    );

    setSelectedImageIndex(0);

    /*
     * DO NOT clear imageRefs.current.
     */
  }

  /*
   * ============================================================
   * GALLERY SCROLL
   * ============================================================
   */
function waitForScrollEnd(
  container: HTMLDivElement,
  callback: () => void
) {
  let lastLeft = container.scrollLeft;
  let stableFrames = 0;
  let elapsedFrames = 0;

  function check() {
    const currentLeft = container.scrollLeft;

    if (currentLeft === lastLeft) {
      stableFrames++;
    } else {
      stableFrames = 0;
      lastLeft = currentLeft;
    }

    elapsedFrames++;

    // Stop once position is stable for 3 frames,
    // or as a safety cap after ~2s so we never hang.
    if (stableFrames >= 3 || elapsedFrames > 120) {
      callback();
      return;
    }

    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);
}
    function scrollToImage(
    index: number
  ) {
    if (!gallery.length) {
      return;
    }

    /*
     * This allows the gallery to wrap:
     *
     * last -> first
     * first -> last
     */
    const safeIndex =
      ((index % gallery.length) +
        gallery.length) %
      gallery.length;

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
      requestAnimationFrame(() => {
        const retrySlide =
          imageRefs.current[
            safeIndex
          ];

        if (!retrySlide) {
          return;
        }

        programmaticScroll.current =
          true;

        const targetLeft =
          retrySlide.offsetLeft -
          (container.clientWidth -
            retrySlide.clientWidth) /
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

        waitForScrollEnd(container, () => {
          programmaticScroll.current = false;
        });
      });

      return;
    }

    /*
     * IMPORTANT:
     * The arrow is intentionally controlling the gallery.
     * The scroll listener must not override it.
     */
    programmaticScroll.current =
      true;

    /*
     * Update image FIRST.
     */
    setSelectedImageIndex(
      safeIndex
    );

    /*
     * Update the color belonging to this image.
     *
     * This is what makes image 0 select the FIRST
     * color instead of accidentally jumping to Purple.
     */
    if (!isWithPhoto) {
      const targetColorIndex =
        galleryItems[
          safeIndex
        ]?.colorIndex;

      if (
        targetColorIndex !==
          undefined &&
        targetColorIndex !==
          selectedColorIndex
      ) {
        const currentOptionName =
          selectedOption?.name;

        setSelectedColorIndex(
          targetColorIndex
        );

        const newOptionIndex =
          colors[
            targetColorIndex
          ]?.options?.findIndex(
            (option) =>
              option.name ===
              currentOptionName
          );

        setSelectedOptionIndex(
          newOptionIndex !==
              undefined &&
            newOptionIndex >= 0
            ? newOptionIndex
            : 0
        );
      }
    }

    /*
     * Scroll to the exact slide.
     */
    const targetLeft =
      slide.offsetLeft -
      (container.clientWidth -
        slide.clientWidth) /
        2;

    container.scrollTo({
      left: Math.max(
        0,
        targetLeft
      ),
      behavior: "smooth",
    });

    /*
     * After the smooth scroll has finished,
     * allow normal swipe detection again.
     */
    waitForScrollEnd(container, () => {
      programmaticScroll.current = false;
    });
  }

  /*
   * ============================================================
   * DETECT SWIPE / SCROLL
   * ============================================================
   */
  /*
   * ============================================================
   * DETECT SWIPE / SCROLL
   * ============================================================
   */

  function handleGalleryScroll() {
    /*
     * VERY IMPORTANT:
     *
     * If an arrow is moving the gallery, don't let
     * the browser's intermediate scroll positions
     * change the selected color.
     */
    if (programmaticScroll.current) {
      return;
    }

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
      (slide, index) => {
        if (!slide) {
          return;
        }

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

    /*
     * Don't update state unnecessarily.
     */
    if (
      closestIndex !==
      selectedImageIndex
    ) {
      setSelectedImageIndex(
        closestIndex
      );
    }

    /*
     * Swiping manually changes the color.
     */
    if (!isWithPhoto) {
      const targetColorIndex =
        galleryItems[
          closestIndex
        ]?.colorIndex;

      if (
        targetColorIndex !==
          undefined &&
        targetColorIndex !==
          selectedColorIndex
      ) {
        scrollSyncing.current =
          true;

        const currentOptionName =
          selectedOption?.name;

        setSelectedColorIndex(
          targetColorIndex
        );

        const newOptionIndex =
          colors[
            targetColorIndex
          ]?.options?.findIndex(
            (option) =>
              option.name ===
              currentOptionName
          );

        setSelectedOptionIndex(
          newOptionIndex !==
              undefined &&
            newOptionIndex >= 0
            ? newOptionIndex
            : 0
        );
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
      selectedImageIndex + 1 >=
      gallery.length
        ? 0
        : selectedImageIndex + 1;

    scrollToImage(next);
  }

  function previousImage() {
    if (gallery.length <= 1) {
      return;
    }

    const previous =
      selectedImageIndex - 1 < 0
        ? gallery.length - 1
        : selectedImageIndex - 1;

    scrollToImage(previous);
  }

  /*
   * ============================================================
   * GALLERY LISTENER
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
  }, [gallery.length]);

  /*
   * ============================================================
   * PHOTO UPLOAD
   * ============================================================
   */

async function handleFrontPhotoChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose a photo under 5MB.");
    return;
  }

  setUploadingFront(true);
  try {
    const url = await uploadCustomerImage(file, "bloom-wand");
    setFrontPhotoUrl(url);
  } catch {
    alert("Couldn't upload your photo. Please check your connection and try again.");
  } finally {
    setUploadingFront(false);
  }
}

async function handleBackPhotoChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose a photo under 5MB.");
    return;
  }

  setUploadingBack(true);
  try {
    const url = await uploadCustomerImage(file, "bloom-wand");
    setBackPhotoUrl(url);
  } catch {
    alert("Couldn't upload your photo. Please check your connection and try again.");
  } finally {
    setUploadingBack(false);
  }
}

  /*
   * ============================================================
   * ADD TO ORDER
   * ============================================================
   */

  function addLine() {
    if (
      !selectedColor ||
      !selectedOption
    ) {
      return;
    }

    if (
      isWithPhoto &&
      (!frontPhotoUrl ||
        !backPhotoUrl)
    ) {
      return;
    }

    setOrderLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        colorName:
          selectedColor.name,
        optionName:
          selectedOption.name,
        price:
          Number(
            selectedOption.price ??
              0
          ),
        quantity,
        image:
          colorOwnImages[0] ??
          previewImage,
        photoUrlFront:
          isWithPhoto
            ? frontPhotoUrl ??
              undefined
            : undefined,
        photoUrlBack:
          isWithPhoto
            ? backPhotoUrl ??
              undefined
            : undefined,
      },
    ]);

    setQuantity(1);
    
  }

  /*
   * ============================================================
   * ORDER QUANTITY
   * ============================================================
   */

  function updateLineQuantity(
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

    updateCartItemQuantity(
      lineId,
      safeQuantity
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

    removeCartItem(id);

    committedLineIds.current.delete(
      id
    );
  }

  /*
   * ============================================================
   * TOTALS
   * ============================================================
   */

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
   * ADD ORDER TO CART
   * ============================================================
   */

  function setCartLineExact(
    line: OrderLine
  ) {
    const cart = JSON.parse(
      localStorage.getItem(
        "cart"
      ) || "[]"
    );

    const withoutLine =
      cart.filter(
        (item: any) =>
          item.id !== line.id
      );

    withoutLine.push({
      id: line.id,
      productId: product.id,
      productName,
      price: line.price,
      quantity: line.quantity,
      scent: null,
      color: line.colorName,
      option: line.optionName,
      image: line.image,
      photoUrlFront:
        line.photoUrlFront ??
        null,
      photoUrlBack:
        line.photoUrlBack ??
        null,
    });

    localStorage.setItem(
      "cart",
      JSON.stringify(
        withoutLine
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "cartUpdated",
        {
          detail: {
            open: true,
          },
        }
      )
    );
  }

  function handleAddToCart() {
    if (!orderLines.length) {
      return;
    }

    orderLines.forEach(
      (line) => {
        setCartLineExact(
          line
        );

        committedLineIds.current.add(
          line.id
        );
      }
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div
      className="relative min-h-screen w-full overflow-visible font-sans"
      style={{
        backgroundColor: SAND,
        color: "#000000",
      }}
    >
      {/* BACK */}

      <button
        type="button"
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

      <main className="relative mx-auto w-full max-w-7xl overflow-visible px-5 pb-16 pt-2 md:px-10 md:pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">

          {/* ================================================= */}
          {/* LEFT — GALLERY                                   */}
          {/* ================================================= */}

          <section className="min-w-0">
            <div className="relative">

              {/* SOFT GLOW */}

              <div
                className="pointer-events-none absolute left-[8%] top-[8%] h-[75%] w-[75%] rounded-full opacity-20 blur-3xl"
                style={{
                  backgroundColor:
                    ACCENT,
                }}
              />

              {/* ================================================= */}
              {/* SCROLLING GALLERY                                 */}
              {/* ================================================= */}

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
                          alt={`${productName} image ${
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
              </div>
{/* ================================================= */}
{/* FIXED GALLERY ARROWS                             */}
{/* ================================================= */}

{gallery.length > 1 && (
  <>
    <button
      type="button"
      onClick={previousImage}
      aria-label="Previous image"
      className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:brightness-95 active:scale-95"
      style={{
        backgroundColor: `${ACCENT}1F`,
        color: ACCENT,
        boxShadow:
          "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      <ChevronLeft
        size={18}
        strokeWidth={2.2}
      />
    </button>

    <button
      type="button"
      onClick={nextImage}
      aria-label="Next image"
      className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:brightness-95 active:scale-95"
      style={{
        backgroundColor: `${ACCENT}1F`,
        color: ACCENT,
        boxShadow:
          "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      <ChevronRight
        size={18}
        strokeWidth={2.2}
      />
    </button>
  </>
)}
            </div>

            {/* COLOR LABEL */}

            {selectedColor && (
              <div className="mt-1 flex justify-center">
                <span
                  className="rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{
                    backgroundColor:
                      `${ACCENT}1A`,
                    color: ACCENT,
                  }}
                >
                  {
                    selectedColor.name
                  }
                </span>
              </div>
            )}

            {/* PRODUCT TITLE */}

            <div className="mt-3 flex flex-col items-center text-center">

              <p
                className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: ACCENT,
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
                    ACCENT,
                }}
              />

              <div className="mt-2 flex items-center justify-center gap-4">

                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-bold md:text-3xl"
                    style={{
                      color: ACCENT,
                    }}
                  >
                    {
                      selectedOption?.price ??
                      product.price
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
                          color: ACCENT,
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

            {/* GALLERY DOTS */}

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
                      aria-label={`Go to image ${
                        index + 1
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
                            ? ACCENT
                            : SAND_BORDER,
                      }}
                    />
                  )
                )}
              </div>
            )}

            {/* COLOR */}

            {colors.length > 0 && (
              <div className="mt-5">

                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: ACCENT,
                  }}
                >
                  Color
                </p>

                <div className="flex flex-wrap gap-3">
                  {colors.map(
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
                          onClick={() =>
                            handleColorChange(
                              index
                            )
                          }
                          className="relative h-12 w-12 overflow-hidden rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95"
                          style={{
                            borderColor:
                              selected
                                ? ACCENT
                                : CREAM,
                            backgroundColor:
                              color.hex ??
                              "#CCCCCC",
                            boxShadow:
                              selected
                                ? `0 0 0 3px ${ACCENT}30`
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
          </section>

          {/* ================================================= */}
          {/* RIGHT — CUSTOMIZATION                             */}
          {/* ================================================= */}

          <section className="flex flex-col lg:pt-6">

            {/* DESCRIPTION */}

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

            {/* STYLE */}

            {selectedColor?.options &&
              selectedColor.options
                .length > 0 && (
                <div className="mt-5">

                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color: ACCENT,
                    }}
                  >
                    Style
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedColor.options.map(
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
                            onClick={() =>
                              handleOptionChange(
                                index
                              )
                            }
                            className="rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                              backgroundColor:
                                isSelected
                                  ? ACCENT
                                  : "transparent",
                              color:
                                isSelected
                                  ? CREAM
                                  : "#000000",
                              borderColor:
                                ACCENT,
                            }}
                          >
                            {
                              option.name
                            }

                            {option.price !==
                              undefined && (
                              <>
                                {" "}
                                ·{" "}
                                {
                                  option.price
                                }{" "}
                                EGP
                              </>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* WITH PHOTO */}

            {isWithPhoto && (
              <div className="mt-5">

                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: ACCENT,
                  }}
                >
                  Your Photos
                </p>

                {selectedColor && (
                  <div className="mb-3 flex items-center gap-2">
                    <img
                      src={
                        selectedColor.image_url ??
                        selectedColor.image_urls?.[0] ??
                        selectedColor.options?.find(
                          (o) =>
                            o.name ===
                            "Without Photo"
                        )?.image_url ??
                        previewImage
                      }
                      alt={
                        selectedColor.name
                      }
                      className="h-12 w-12 rounded-xl object-contain"
                      style={{
                        backgroundColor:
                          "#F7EEDC",
                      }}
                    />

                    <span className="text-xs opacity-60">
                      {
                        selectedColor.name
                      }{" "}
                      wand
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">

                  {/* FRONT */}

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        frontFileInputRef.current?.click()
                      }
                      className="w-full rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          "transparent",
                        borderColor:
                          ACCENT,
                        color:
                          "#000000",
                      }}
                    >
                      Front photo
                    </button>

                    <input
                      ref={
                        frontFileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={
                        handleFrontPhotoChange
                      }
                    />

                    {frontPhotoUrl && (
                      <div className="mt-2 flex justify-center">
                        <img
                          src={
                            frontPhotoUrl
                          }
                          alt="Front photo"
                          className="h-16 w-16 rounded-xl object-cover"
                          style={{
                            border: `1px solid ${ACCENT}`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* BACK */}

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        backFileInputRef.current?.click()
                      }
                      className="w-full rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        backgroundColor:
                          "transparent",
                        borderColor:
                          ACCENT,
                        color:
                          "#000000",
                      }}
                    >
                      Back photo
                    </button>

                    <input
                      ref={
                        backFileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={
                        handleBackPhotoChange
                      }
                    />

                    {backPhotoUrl && (
                      <div className="mt-2 flex justify-center">
                        <img
                          src={
                            backPhotoUrl
                          }
                          alt="Back photo"
                          className="h-16 w-16 rounded-xl object-cover"
                          style={{
                            border: `1px solid ${ACCENT}`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <p
                  className="mt-2 text-[10px]"
                  style={{
                    color:
                      "rgba(0,0,0,0.45)",
                  }}
                >
                  Both a front and back photo are required for this style.
                </p>
              </div>
            )}
            {(uploadingFront || uploadingBack) && (
  <p className="mt-1 text-xs" style={{ color: ACCENT }}>
    Uploading your photo…
  </p>
)}

            {/* QUANTITY */}

            <div className="mt-5">

              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color: ACCENT,
                }}
              >
                Quantity
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold transition-all hover:scale-105 active:scale-95"
                >
                  −
                </button>

                <span className="w-5 text-center text-sm font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        current + 1
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold transition-all hover:scale-105 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* ADD TO ORDER */}

            <button
              type="button"
              onClick={addLine}
              disabled={
  !selectedOption ||
  uploadingFront ||
  uploadingBack ||
  (isWithPhoto && (!frontPhotoUrl || !backPhotoUrl))
}
              className="mt-6 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{
                backgroundColor:
                  ACCENT,
                color: CREAM,
              }}
              onMouseEnter={(e) => {
                if (
                  !e.currentTarget.disabled
                ) {
                  e.currentTarget.style.backgroundColor =
                    ACCENT_DARK;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  ACCENT;
              }}
            >
              + Add to Order
            </button>

            {/* YOUR ORDER */}

            {orderLines.length > 0 && (
              <div className="mt-5">

                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: ACCENT,
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
                        key={`${line.id}-${index}`}
                        className="rounded-2xl p-3"
                        style={{
                          backgroundColor:
                            SAND,
                        }}
                      >
                        <div className="flex items-start gap-3">

                          <div className="flex flex-shrink-0 gap-1">

                            {line.image && (
                              <img
                                src={
                                  line.image
                                }
                                alt="Wand color"
                                className="h-12 w-12 rounded-xl object-contain"
                                style={{
                                  backgroundColor:
                                    "#F7EEDC",
                                }}
                              />
                            )}

                            {line.photoUrlFront && (
                              <img
                                src={
                                  line.photoUrlFront
                                }
                                alt="Front photo"
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            )}

                            {line.photoUrlBack && (
                              <img
                                src={
                                  line.photoUrlBack
                                }
                                alt="Back photo"
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-semibold">
                              {
                                line.colorName
                              }
                            </p>

                            <p className="mt-1 text-xs opacity-55">
                              {
                                line.optionName
                              }
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">

                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLineQuantity(
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
                                    updateLineQuantity(
                                      line.id,
                                      line.quantity +
                                        1
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <span
                                className="text-sm font-bold"
                                style={{
                                  color:
                                    ACCENT,
                                }}
                              >
                                {
                                  line.price *
                                  line.quantity
                                }{" "}
                                EGP
                              </span>
                            </div>
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

                {/* TOTAL */}

                <div
                  className="mt-4 flex items-center justify-between rounded-2xl px-5 py-4"
                  style={{
                    backgroundColor:
                      "transparent",
                    border: `1px solid ${ACCENT}`,
                  }}
                >
                  <span className="text-sm font-semibold">
                    {
                      totalQuantity
                    }{" "}
                    wand
                    {totalQuantity !==
                    1
                      ? "s"
                      : ""}{" "}
                    total
                  </span>

                  <span
                    className="text-lg font-bold"
                    style={{
                      color: ACCENT,
                    }}
                  >
                    {
                      totalOrderPrice
                    }{" "}
                    EGP
                  </span>
                </div>

                {/* ADD TO CART */}

                <button
                  type="button"
                  onClick={
                    handleAddToCart
                  }
                  className="mt-4 w-full rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                  style={{
                    backgroundColor:
                      ACCENT,
                    color: CREAM,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      ACCENT_DARK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      ACCENT;
                  }}
                >
                  Add Order to Cart
                </button>
              </div>
            )}

            {/* BOTTOM DIVIDER */}

            <div
              className="mt-6 grid grid-cols-2 gap-5 border-t pt-5"
              style={{
                borderColor:
                  SAND_BORDER,
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}