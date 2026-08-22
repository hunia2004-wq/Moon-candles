"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product } from "@/lib/supabase/types";

type OrderLine = {
  id: string;
  colorName: string;
  optionName: string;
  price: number;
  quantity: number;
  image: string;
  photoUrl?: string;
};

type UploadedPhoto = {
  id: string;
  url: string;
};

const ACCENT = "#6E86C7";
const ACCENT_DARK = "#5A70B0";
const CREAM = "#FFF4E6";
const SAND = "#EFE3C4";
const SAND_BORDER = "#D8C9B0";

/*
 * Bloom Wand "With Photo" gallery.
 *
 * These are intentionally hardcoded because the Supabase
 * image_urls currently contains only one image.
 */
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

  const [uploadedPhotos, setUploadedPhotos] =
    useState<UploadedPhoto[]>([]);

  const [selectedPhotoId, setSelectedPhotoId] =
    useState<string | null>(null);

  const imageScrollRef =
    useRef<HTMLDivElement>(null);

  const imageRefs =
    useRef<(HTMLDivElement | null)[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const colors = product.colors ?? [];

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

  const gallery = isWithPhoto
    ? BLOOM_WAND_WITH_PHOTO_IMAGES
    : selectedOption?.image_urls?.length
    ? selectedOption.image_urls
    : selectedOption?.image_url
    ? [selectedOption.image_url]
    : selectedColor?.image_urls?.length
    ? selectedColor.image_urls
    : selectedColor?.image_url
    ? [selectedColor.image_url]
    : product.image_urls ?? [];

  const previewImage =
    gallery[selectedImageIndex] ??
    gallery[0] ??
    "";

  /*
   * ============================================================
   * RESET GALLERY
   * ============================================================
   */

  useEffect(() => {
    setSelectedImageIndex(0);

    imageRefs.current = [];

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

  function handleColorChange(index: number) {
    const currentOptionName =
      selectedColor?.options?.[
        selectedOptionIndex
      ]?.name;

    setSelectedColorIndex(index);

    const newOptionIndex =
      colors[index]?.options?.findIndex(
        (option) =>
          option.name === currentOptionName
      );

    if (
      newOptionIndex !== undefined &&
      newOptionIndex >= 0
    ) {
      setSelectedOptionIndex(newOptionIndex);
    } else {
      setSelectedOptionIndex(0);
    }

    setSelectedImageIndex(0);
    imageRefs.current = [];
  }

  /*
   * ============================================================
   * OPTION CHANGE
   * ============================================================
   */

  function handleOptionChange(index: number) {
    setSelectedOptionIndex(index);
    setSelectedImageIndex(0);
    imageRefs.current = [];
  }

  /*
   * ============================================================
   * GALLERY SCROLL
   * ============================================================
   */

  function scrollToImage(index: number) {
    if (!gallery.length) {
      return;
    }

    const safeIndex = Math.max(
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
      imageRefs.current[safeIndex];

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
      (containerWidth - slideWidth) /
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
  }

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
      container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    imageRefs.current.forEach(
      (slide, index) => {
        if (!slide) return;

        const slideCenter =
          slide.offsetLeft +
          slide.clientWidth / 2;

        const distance =
          Math.abs(
            slideCenter -
              containerCenter
          );

        if (
          distance <
          closestDistance
        ) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    );

    setSelectedImageIndex(
      closestIndex
    );
  }

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

  function handlePhotosChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = e.target.files;

    if (!files) {
      return;
    }

    const newPhotos: UploadedPhoto[] =
      Array.from(files).map(
        (file) => ({
          id: `${Date.now()}-${Math.random()}`,
          url: URL.createObjectURL(
            file
          ),
        })
      );

    setUploadedPhotos((prev) => [
      ...prev,
      ...newPhotos,
    ]);

    if (
      !selectedPhotoId &&
      newPhotos.length > 0
    ) {
      setSelectedPhotoId(
        newPhotos[0].id
      );
    }

    e.target.value = "";
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

    const chosenPhoto =
      uploadedPhotos.find(
        (photo) =>
          photo.id ===
          selectedPhotoId
      );

    if (
      isWithPhoto &&
      !chosenPhoto
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
          selectedColor.image_url ??
          selectedOption.image_url ??
          previewImage,
        photoUrl:
          isWithPhoto
            ? chosenPhoto?.url
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

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              quantity:
                newQuantity,
            }
          : line
      )
    );
  }

  function removeLine(id: string) {
    setOrderLines((prev) =>
      prev.filter(
        (line) =>
          line.id !== id
      )
    );
  }

  /*
   * ============================================================
   * APPLY PHOTO TO ALL
   * ============================================================
   */

  function applyPhotoToAll(
    photoUrl: string
  ) {
    setOrderLines((prev) =>
      prev.map((line) =>
        line.optionName ===
        "With Photo"
          ? {
              ...line,
              photoUrl,
            }
          : line
      )
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

  function handleAddToCart() {
    if (!orderLines.length) {
      return;
    }

    try {
      const existingCart =
        JSON.parse(
          localStorage.getItem(
            "cart"
          ) || "[]"
        );

      const newItems =
        orderLines.map(
          (line) => ({
            id: line.id,
            productId:
              product.id,
            productName,
            price: line.price,
            quantity:
              line.quantity,
            color:
              line.colorName,
            option:
              line.optionName,
            scent: null,
            image:
              line.image,
            photoUrl:
              line.photoUrl,
          })
        );

      const updatedCart = [
        ...existingCart,
        ...newItems,
      ];

      localStorage.setItem(
        "cart",
        JSON.stringify(
          updatedCart
        )
      );

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      router.push("/cart");
    } catch (error) {
      console.error(
        "Failed to add Bloom Wand to cart:",
        error
      );
    }
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

              {/* GALLERY */}

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

                {gallery.length >
                  1 && (
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
                          SAND_BORDER,
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
                          SAND_BORDER,
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
                  {selectedColor.name}
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
                      color:
                        ACCENT,
                    }}
                  >
                    {selectedOption?.price ??
                      product.price}
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
                            ACCENT,
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
                    color:
                      ACCENT,
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
                      color:
                        ACCENT,
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

                <div className="mb-2 flex items-center justify-between">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color:
                        ACCENT,
                    }}
                  >
                    Your Photo
                  </p>

                  {uploadedPhotos.length >
                    0 && (
                    <span className="text-[10px] font-medium opacity-50">
                      {
                        uploadedPhotos.length
                      }{" "}
                      uploaded
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="w-full rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor:
                      "transparent",
                    borderColor:
                      ACCENT,
                    color:
                      "#000000",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      Upload a photo
                    </span>

                    <span
                      className="text-xs"
                      style={{
                        color:
                          ACCENT,
                      }}
                    >
                      JPG / PNG
                    </span>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={
                    handlePhotosChange
                  }
                />

                {/* UPLOADED PHOTOS */}

                {uploadedPhotos.length >
                  0 && (
                  <div className="mt-3 rounded-2xl p-3">
                    <div className="flex flex-wrap gap-3">
                      {uploadedPhotos.map(
                        (
                          photo
                        ) => {
                          const selected =
                            photo.id ===
                            selectedPhotoId;

                          return (
                            <div
                              key={
                                photo.id
                              }
                              className="flex flex-col items-center gap-1"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhotoId(
                                    photo.id
                                  )
                                }
                                className="h-16 w-16 overflow-hidden rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95"
                                style={{
                                  borderColor:
                                    selected
                                      ? ACCENT
                                      : "transparent",
                                  boxShadow:
                                    selected
                                      ? `0 0 0 2px ${ACCENT}25`
                                      : "none",
                                }}
                              >
                                <img
                                  src={
                                    photo.url
                                  }
                                  alt="Uploaded photo"
                                  className="h-full w-full object-cover"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  applyPhotoToAll(
                                    photo.url
                                  )
                                }
                                className="text-[10px] font-medium underline transition-opacity hover:opacity-70"
                                style={{
                                  color:
                                    ACCENT,
                                }}
                              >
                                apply to all
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUANTITY */}

            <div className="mt-5">

              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color:
                    ACCENT,
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
                (isWithPhoto &&
                  uploadedPhotos.length ===
                    0)
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

            {/* ================================================= */}
            {/* YOUR ORDER                                       */}
            {/* ================================================= */}

            {orderLines.length > 0 && (
              <div className="mt-5">

                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color:
                      ACCENT,
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
                        <div className="flex items-center justify-between gap-3">

                          {/* LEFT */}

                          <div className="flex min-w-0 items-center gap-3">

                            {line.image && (
                              <img
                                src={
                                  line.image
                                }
                                alt=""
                                className="h-12 w-12 flex-shrink-0 rounded-xl object-contain"
                                style={{
                                  backgroundColor:
                                    "#F7EEDC",
                                }}
                              />
                            )}

                            {line.photoUrl && (
                              <img
                                src={
                                  line.photoUrl
                                }
                                alt="Selected photo"
                                className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                              />
                            )}

                            <div className="min-w-0">
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
                            </div>
                          </div>

                          {/* RIGHT */}

                          <div className="flex flex-shrink-0 items-center gap-2">

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

                            <span
                              className="ml-2 min-w-[70px] text-right text-sm font-bold"
                              style={{
                                color:
                                  ACCENT,
                              }}
                            >
                              {line.price *
                                line.quantity}{" "}
                              EGP
                            </span>
                          </div>
                        </div>

                        {/* REMOVE */}

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
                    {totalQuantity}{" "}
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
                      color:
                        ACCENT,
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