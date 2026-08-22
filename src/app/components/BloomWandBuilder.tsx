"use client";

import { useState, useRef } from "react";
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

/*
 * These are the 3 Bloom Wand "With Photo" images.
 * We use these directly instead of relying on the
 * image_urls stored in Supabase.
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
  const colors = product.colors ?? [];

  const [selectedColorIndex, setSelectedColorIndex] =
    useState(0);

  const [selectedOptionIndex, setSelectedOptionIndex] =
    useState(0);

  const [selectedPreviewImageIndex, setSelectedPreviewImageIndex] =
    useState(0);

  const [quantity, setQuantity] = useState(1);

  const [orderLines, setOrderLines] = useState<OrderLine[]>(
    []
  );

  const [uploadedPhotos, setUploadedPhotos] = useState<
    UploadedPhoto[]
  >([]);

  const [selectedPhotoId, setSelectedPhotoId] =
    useState<string | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const selectedColor =
    colors[selectedColorIndex];

  const selectedOption =
    selectedColor?.options?.[selectedOptionIndex];

  const isWithPhoto =
    selectedOption?.name === "With Photo";

  /*
   * IMPORTANT:
   *
   * For "With Photo", ALWAYS use the 3 URLs above.
   * Do NOT use Supabase's image_urls field because
   * it currently only contains one image.
   */
  const previewImages: string[] = isWithPhoto
    ? BLOOM_WAND_WITH_PHOTO_IMAGES
    : selectedOption?.image_urls?.length
      ? selectedOption.image_urls
      : selectedOption?.image_url
        ? [selectedOption.image_url]
        : selectedColor?.image_url
          ? [selectedColor.image_url]
          : [];

  const previewImage =
    previewImages[selectedPreviewImageIndex] ??
    previewImages[0] ??
    selectedColor?.image_url ??
    "";

  /*
   * Bloom Wand base image used in the order list.
   */
  const orderWandImage =
    selectedColor?.image_url ??
    selectedColor?.options?.[0]?.image_url ??
    "";

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

    /*
     * Always start the gallery from image 1
     * when changing color.
     */
    setSelectedPreviewImageIndex(0);
  }

  function handleOptionChange(index: number) {
    setSelectedOptionIndex(index);

    /*
     * Always start from the first image when
     * changing between options.
     */
    setSelectedPreviewImageIndex(0);
  }

  function handlePhotosChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = e.target.files;

    if (!files) return;

    const newPhotos: UploadedPhoto[] =
      Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
      }));

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

    /*
     * Allows selecting the same file again.
     */
    e.target.value = "";
  }

  function addLine() {
    if (
      !selectedColor ||
      !selectedOption
    ) {
      return;
    }

    const chosenPhoto =
      uploadedPhotos.find(
        (p) => p.id === selectedPhotoId
      );

    /*
     * With Photo requires an uploaded photo.
     */
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
        colorName: selectedColor.name,
        optionName: selectedOption.name,
        price:
          selectedOption.price ?? 0,
        quantity,

        /*
         * For With Photo:
         * use the actual Bloom Wand base image.
         *
         * For other options:
         * use the selected option image.
         */
        image: isWithPhoto
          ? orderWandImage
          : previewImage,

        /*
         * Store the customer's uploaded photo
         * separately.
         */
        photoUrl: isWithPhoto
          ? chosenPhoto?.url
          : undefined,
      },
    ]);

    setQuantity(1);
  }

  function removeLine(id: string) {
    setOrderLines((prev) =>
      prev.filter(
        (line) => line.id !== id
      )
    );
  }

  function applyPhotoToAll(
    photoUrl: string
  ) {
    setOrderLines((prev) =>
      prev.map((line) =>
        line.optionName === "With Photo"
          ? {
              ...line,
              photoUrl,
            }
          : line
      )
    );
  }

  const totalQuantity =
    orderLines.reduce(
      (sum, line) =>
        sum + line.quantity,
      0
    );

  const totalPrice =
    orderLines.reduce(
      (sum, line) =>
        sum +
        line.price *
          line.quantity,
      0
    );

  function handleAddToCart() {
    console.log(
      "Bloom Wand order:",
      orderLines
    );
  }

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{
        backgroundColor: "#efe3c4",
      }}
    >
      <main className="w-full max-w-3xl px-6 py-16 md:px-16">

        {/* HEADER */}

        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            color: ACCENT,
          }}
        >
          build your own
        </p>

        <h1
          className="mt-2 text-3xl font-bold uppercase tracking-wide md:text-4xl"
          style={{
            color: "#000000",
          }}
        >
          {product.name}
        </h1>

        {product.description && (
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{
              color: "#000000",
              opacity: 0.75,
            }}
          >
            {product.description}
          </p>
        )}

        {/* BUILDER CARD */}

        <div
          className="mt-6 flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:p-8"
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow:
              "0 12px 30px rgba(110,134,199,0.1)",
          }}
        >

          {/* LEFT: PREVIEW + GALLERY */}

          <div className="flex w-full flex-shrink-0 flex-col items-center md:w-48">

            {/* MAIN PREVIEW */}

            <div
              className="flex aspect-square w-full items-center justify-center rounded-2xl p-4"
              style={{
                backgroundColor: "#efe3c4",
              }}
            >
              {previewImage && (
                <img
                  src={previewImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            {/* IMAGE GALLERY */}

            {isWithPhoto &&
              previewImages.length > 1 && (
                <div className="mt-3 flex w-full justify-center gap-2">

                  {previewImages.map(
                    (url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedPreviewImageIndex(
                            index
                          )
                        }
                        className="h-14 w-14 overflow-hidden rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor:
                            "#FFFFFF",
                          borderColor:
                            index ===
                            selectedPreviewImageIndex
                              ? ACCENT
                              : "transparent",
                        }}
                      >
                        <img
                          src={url}
                          alt={`${product.name} photo ${
                            index + 1
                          }`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    )
                  )}

                </div>
              )}

          </div>

          {/* RIGHT: SELECTORS */}

          <div className="flex-1">

            {/* COLOR */}

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                color: ACCENT,
              }}
            >
              Color
            </p>

            <div className="mb-6 flex flex-wrap gap-4">

              {colors.map(
                (color, index) => {

                  const swatchImg =
                    color.options?.[0]
                      ?.image_url ??
                    color.image_url;

                  const isSelected =
                    index ===
                    selectedColorIndex;

                  return (
                    <div
                      key={color.name}
                      className="flex flex-col items-center gap-2"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          handleColorChange(
                            index
                          )
                        }
                        title={color.name}
                        className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95"
                        style={{
                          borderColor:
                            isSelected
                              ? ACCENT
                              : "transparent",
                          backgroundColor:
                            color.hex ??
                            "#ccc",
                        }}
                      >
                        {swatchImg && (
                          <img
                            src={swatchImg}
                            alt={color.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>

                      <span
                        className="text-center text-xs font-medium"
                        style={{
                          color:
                            "#000000",
                        }}
                      >
                        {color.name}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

            {/* OPTION */}

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                color: ACCENT,
              }}
            >
              Option
            </p>

            <div className="mb-6 flex flex-wrap gap-2">

              {selectedColor?.options?.map(
                (option, index) => {

                  const isSelected =
                    index ===
                    selectedOptionIndex;

                  return (
                    <div
                      key={option.name}
                      className="flex flex-col items-start gap-2"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          handleOptionChange(
                            index
                          )
                        }
                        className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                          backgroundColor:
                            isSelected
                              ? ACCENT
                              : "#FFFFFF",
                          color:
                            isSelected
                              ? "#FFF4E6"
                              : ACCENT,
                          border:
                            `1px solid ${ACCENT}`,
                        }}
                      >
                        {option.name} ·{" "}
                        {option.price} EGP
                      </button>

                      {/* UPLOAD PHOTO */}

                      {isSelected &&
                        option.name ===
                          "With Photo" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                              style={{
                                backgroundColor:
                                  "#efe3c4",
                                color:
                                  "#000000",
                                border:
                                  "1px solid #efe3c4",
                              }}
                            >
                              Upload a photo
                            </button>

                            <input
                              ref={
                                fileInputRef
                              }
                              type="file"
                              accept="image/jpeg,image/png"
                              multiple
                              className="hidden"
                              onChange={
                                handlePhotosChange
                              }
                            />
                          </>
                        )}

                    </div>
                  );
                }
              )}

            </div>

            {/* UPLOADED PHOTOS */}

            {isWithPhoto &&
              uploadedPhotos.length >
                0 && (
                <div className="mb-6">

                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
                    style={{
                      color: ACCENT,
                    }}
                  >
                    Your photos
                  </p>

                  <div className="flex flex-wrap gap-3">

                    {uploadedPhotos.map(
                      (photo) => {

                        const isSelected =
                          photo.id ===
                          selectedPhotoId;

                        return (
                          <div
                            key={photo.id}
                            className="flex flex-col items-center gap-1"
                          >

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPhotoId(
                                  photo.id
                                )
                              }
                              className="h-16 w-16 overflow-hidden rounded-lg border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                              style={{
                                borderColor:
                                  isSelected
                                    ? ACCENT
                                    : "transparent",
                              }}
                            >
                              <img
                                src={
                                  photo.url
                                }
                                alt=""
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

            {/* QUANTITY */}

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                color: ACCENT,
              }}
            >
              Quantity
            </p>

            <div className="mb-6 flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    (q) =>
                      Math.max(
                        1,
                        q - 1
                      )
                  )
                }
                className="h-9 w-9 rounded-full text-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor:
                    "#efe3c4",
                  color: "#000000",
                }}
              >
                −
              </button>

              <span
                className="w-8 text-center text-base font-semibold"
                style={{
                  color: "#000000",
                }}
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    (q) => q + 1
                  )
                }
                className="h-9 w-9 rounded-full text-lg font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor:
                    "#efe3c4",
                  color: "#000000",
                }}
              >
                +
              </button>

            </div>

            {/* ADD TO ORDER */}

            <button
              type="button"
              onClick={addLine}
              disabled={
                isWithPhoto &&
                uploadedPhotos.length === 0
              }
              className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-md transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100"
              style={{
                backgroundColor:
                  ACCENT,
                color: "#FFF4E6",
              }}
            >
              + Add to order
            </button>

          </div>

        </div>

        {/* RUNNING ORDER */}

        {orderLines.length > 0 && (
          <div className="mt-8">

            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{
                color: ACCENT,
              }}
            >
              Your order
            </p>

            <div className="flex flex-col gap-2">

              {orderLines.map(
                (line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor:
                        "#FFFFFF",
                    }}
                  >

                    <div className="flex items-center gap-3">

                      {/* WAND */}

                      {line.image && (
                        <img
                          src={line.image}
                          alt=""
                          className="h-10 w-10 rounded-lg object-contain"
                          style={{
                            backgroundColor:
                              "#efe3c4",
                          }}
                        />
                      )}

                      {/* CUSTOMER PHOTO */}

                      {line.photoUrl && (
                        <img
                          src={line.photoUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}

                      <span
                        className="text-sm"
                        style={{
                          color:
                            "#000000",
                        }}
                      >
                        {line.quantity}×{" "}
                        {line.colorName} —{" "}
                        {line.optionName}
                      </span>

                    </div>

                    <div className="flex items-center gap-4">

                      <span
                        className="text-sm font-semibold"
                        style={{
                          color:
                            ACCENT,
                        }}
                      >
                        {line.price *
                          line.quantity}{" "}
                        EGP
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeLine(
                            line.id
                          )
                        }
                        className="text-xs font-medium underline transition-opacity hover:opacity-70"
                        style={{
                          color:
                            "#000000",
                          opacity: 0.5,
                        }}
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
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-4"
              style={{
                backgroundColor:
                  "#efe3c4",
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    "#000000",
                }}
              >
                {totalQuantity} wand
                {totalQuantity !== 1
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
                {totalPrice} EGP
              </span>
            </div>

            {/* CART */}

            <button
              type="button"
              onClick={
                handleAddToCart
              }
              className="mt-4 w-full rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor:
                  ACCENT,
                color: "#FFF4E6",
              }}
            >
              Add order to Cart
            </button>

          </div>
        )}

      </main>
    </div>
  );
}