"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CandleLabelWrap, {
  LABEL_FONTS,
  PLACEHOLDER_IMG_URL,
} from "../components/CandleLabelWrap";
import { captureAndUploadLabel } from "@/lib/captureDesign";
import LabelPlaceholder from "../components/LabelPlaceholder";
import { addToCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { uploadCustomerImage } from "@/lib/uploadCustomerImage";

// Static "how it looks in real life" photo shown under the preview
const SIZES = [
  {
    id: "small",
    label: "150 ML",
    grams: "150 ml",
    price: 450,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/150ml.png?v=2",
    reference:
      "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20150.png",
  },
  {
    id: "large",
    label: "380 ML",
    grams: "380 ml",
    price: 680,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/380ml.png",
    reference:
      "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20380.png",
  },
] as const;

const MAX_MESSAGE_LEN = 50;

type SizeId = (typeof SIZES)[number]["id"];

export default function CustomizeCandlePage() {
  const router = useRouter();

  const [size, setSize] = useState<SizeId>("small");
  const [scent, setScent] = useState<string>("");
  const [scents, setScents] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [fontId, setFontId] = useState<string>(LABEL_FONTS[0].id);
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [added, setAdded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [showPreview, setShowPreview] = useState(false);

  const selectedSize = SIZES.find((s) => s.id === size)!;

  useEffect(() => {
    async function loadScents() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("scents")
        .not("scents", "is", null)
        .limit(1)
        .single();

      if (error) {
        console.error("Failed to load scents:", error.message);
        return;
      }

      if (data?.scents?.length) {
        setScents(data.scents);
        setScent(data.scents[0]);
      }
    }

    loadScents();
  }, []);

  useEffect(() => {
    setAdded(false);
  }, [size, scent, message, photoUrl, fontId]);

  async function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose a photo under 5MB.");
      return;
    }

    setUploading(true);

    try {
      const url = await uploadCustomerImage(file, "custom-candle");
      setPhotoUrl(url);
    } catch {
      alert(
        "Couldn't upload your photo. Please check your connection and try again."
      );
    } finally {
      setUploading(false);
    }
  }

  async function addCandleToCart(goToCheckout: boolean) {
    if (uploading || rendering) return;

    if (added) {
      if (goToCheckout) window.location.href = "/checkout";
      return;
    }

    if (!photoUrl) {
      alert("Please add your photo first.");
      return;
    }

    setRendering(true);

    const fontFamily =
      LABEL_FONTS.find((f) => f.id === fontId)?.family ??
      LABEL_FONTS[0].family;

    const input = {
      templateUrl: PLACEHOLDER_IMG_URL,
      templateWidth: 736,
      templateHeight: 238,
      photoUrl,
      message,
      fontFamily,
    };

    // One automatic retry, since a first attempt can fail on a slow phone.
    let renderedDesignUrl = await captureAndUploadLabel(input);

    if (!renderedDesignUrl) {
      renderedDesignUrl = await captureAndUploadLabel(input);
    }

    setRendering(false);

    if (!renderedDesignUrl) {
      alert(
        "We couldn't prepare your sticker. Please check your connection and try again."
      );
      return;
    }

    addToCart(
      {
        id: `custom-candle-${Date.now()}`,
        productId: "custom-candle",
        productName: "Custom Candle",
        price: selectedSize.price,
        quantity: 1,
        scent: scent || null,
        color: selectedSize.label,
        image: selectedSize.img,
        customization: {
          type: "customized-candle",
          size,
          message,
          photoUrl,
          fontId,
          renderedDesignUrl,
        },
      },
      { open: false }
    );

    setAdded(true);

    if (goToCheckout) {
      window.location.href = "/checkout";
    } else {
      window.dispatchEvent(new Event("openCart"));
    }
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: "#FFF4E6",
      }}
    >
      {/* =====================================================
          TOP: LIVE CANDLE PREVIEW
      ===================================================== */}

      <div
        ref={previewRef}
        className="
          relative
          flex
          items-center
          justify-center
          px-6
          pt-2
          pb-4
        "
      >
        <CandleLabelWrap
          size={selectedSize}
          candleImg={selectedSize.img}
          photoUrl={photoUrl}
          message={message}
          onMessageChange={setMessage}
          onPhotoZoneClick={() => fileInputRef.current?.click()}
          fontId={fontId}
          onFontChange={setFontId}
          maxLen={MAX_MESSAGE_LEN}
        />
      </div>

      {/* =====================================================
          CUSTOMIZATION FORM
      ===================================================== */}

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-2xl
          flex-col
          px-6
          py-4
          md:px-12
          md:py-16
        "
      >
        <p
          className="
            mb-3
            text-xs
            uppercase
            tracking-[0.25em]
            md:text-sm
          "
          style={{
            color: "#DE4B33",
          }}
        >
          made by you, for you
        </p>

        <h1 className="mb-4 font-serif leading-[1.05]">
          <span
            className="
              block
              text-3xl
              font-bold
              md:text-5xl
            "
            style={{
              color: "#000000",
            }}
          >
            Customize
          </span>

          <span
            className="
              block
              text-3xl
              font-bold
              md:text-5xl
            "
            style={{
              color: "#DE4B33",
            }}
          >
            your candle
          </span>
        </h1>

        <p
          className="
            mb-10
            text-sm
            leading-6
            md:text-base
          "
          style={{
            color: "rgba(0,0,0,0.62)",
          }}
        >
          If you have any questions or would like something
          other than the options provided, feel free to DM us
          on Instagram @the_moon_candlesshop.
        </p>

        {/* =====================================================
            STEP 1 — SIZE
        ===================================================== */}

        <StepLabel n={1} title="Choose your size" />

        <div className="mb-8 grid grid-cols-2 gap-3">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className="
                flex
                flex-col
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-5
                transition-all
                duration-150
                hover:scale-[1.03]
                active:scale-[0.97]
                hover:shadow-md
              "
              style={{
                border: `1.5px solid ${
                  size === s.id
                    ? "#DE4B33"
                    : "rgba(0,0,0,0.12)"
                }`,
                backgroundColor:
                  size === s.id
                    ? "#EFE3C4"
                    : "transparent",
              }}
            >
              <img
                src={s.img}
                alt=""
                className="h-10 w-10 object-contain"
              />

              <span
                className="text-xs font-semibold tracking-wide"
                style={{
                  color: "#000000",
                }}
              >
                {s.label}
              </span>

              <span
                className="text-[11px]"
                style={{
                  color: "rgba(0,0,0,0.62)",
                }}
              >
                {s.price} LE
              </span>
            </button>
          ))}
        </div>

        {/* =====================================================
            STEP 2 — SCENT
        ===================================================== */}

        <StepLabel n={2} title="Choose your scent" />

        <div className="mb-8 grid grid-cols-2 gap-3">
          {scents.length === 0 && (
            <p
              className="col-span-2 text-xs"
              style={{
                color: "rgba(0,0,0,0.5)",
              }}
            >
              Loading scents...
            </p>
          )}

          {scents.map((s) => (
            <button
              key={s}
              onClick={() => setScent(s)}
              className="
                flex
                flex-col
                items-start
                gap-1
                rounded-xl
                px-4
                py-3
                text-left
                transition-all
                duration-150
                hover:shadow-sm
              "
              style={{
                border: `1.5px solid ${
                  scent === s
                    ? "#DE4B33"
                    : "rgba(0,0,0,0.12)"
                }`,
                backgroundColor:
                  scent === s
                    ? "#EFE3C4"
                    : "transparent",
              }}
            >
              <span
                className="text-xs font-semibold tracking-wide"
                style={{
                  color: "#000000",
                }}
              >
                {s}
              </span>
            </button>
          ))}
        </div>

        {/* Hidden photo input */}

        {uploading && (
          <p
            className="mt-2 text-xs"
            style={{ color: "#DE4B33" }}
          >
            Uploading your photo…
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handlePhotoChange}
        />

        {/* =====================================================
            PREVIEW CTA
        ===================================================== */}

        <div
          className="
            mt-auto
            flex
            items-center
            gap-4
          "
        >
          <button
            onClick={() => setShowPreview(true)}
            className="
              inline-flex
              flex-1
              items-center
              justify-center
              gap-2
              rounded-full
              font-medium
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-md
              active:scale-[0.98]
              md:flex-none
            "
            style={{
              backgroundColor: "#DE4B33",
              color: "#FFF4E6",
              fontSize: "clamp(14px, 1.5vw, 16px)",
              padding:
                "clamp(10px, 0.9vw, 12px) clamp(20px, 2.2vw, 32px)",
            }}
          >
            Preview my candle
          </button>

          <span
            className="text-lg font-semibold"
            style={{
              color: "#000000",
            }}
          >
            {selectedSize.price} LE
          </span>
        </div>
      </div>

      {/* =====================================================
          REVIEW / PREVIEW PAGE
      ===================================================== */}

      {showPreview && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            overflow-y-auto
            px-5
            py-8
            md:px-8
            md:py-10
          "
          style={{
            backgroundColor: "#FFF4E6",
          }}
        >
          {/* =====================================================
              CLOSE BUTTON
          ===================================================== */}

          <button
            type="button"
            onClick={() => setShowPreview(false)}
            aria-label="Close preview"
            className="fixed right-4 top-4 z-[10000] flex h-12 w-12 items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-90"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#000000",
              border: "2px solid rgba(0,0,0,0.18)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.20)",
              fontSize: "25px",
              lineHeight: "1",
              fontWeight: 700,
              padding: 0,
              minWidth: "48px",
              minHeight: "48px",
              WebkitTextFillColor: "#000000",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                lineHeight: 1,
                color: "#000000",
                WebkitTextFillColor: "#000000",
              }}
            >
              ×
            </span>
          </button>

          {/* =====================================================
              REVIEW CONTENT
          ===================================================== */}

          <div
            className="
              mx-auto
              flex
              w-full
              max-w-md
              flex-col
              items-center
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-5 mt-5 text-center">
              <p
                className="
                  mb-2
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.25em]
                "
                style={{
                  color: "#DE4B33",
                }}
              >
                your custom candle
              </p>

              <h2
                className="
                  text-3xl
                  font-semibold
                  leading-tight
                "
                style={{
                  color: "#000000",
                }}
              >
                Here's your candle
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-5
                "
                style={{
                  color: "rgba(0,0,0,0.58)",
                }}
              >
                A little preview before your candle
                comes to life.
              </p>
            </div>

            {/* =================================================
                CANDLE
                UNCHANGED
            ================================================= */}

            <img
              src={selectedSize.img}
              alt=""
              className="w-48 object-contain md:w-56"
            />

            {/* =================================================
                LABEL
                UNCHANGED
            ================================================= */}

            <div className="mt-5 w-full">
              <LabelPlaceholder
                message={message}
                onMessageChange={setMessage}
                photoUrl={photoUrl}
                onPhotoClick={() =>
                  fileInputRef.current?.click()
                }
                maxLen={MAX_MESSAGE_LEN}
                fontFamily={
                  LABEL_FONTS.find(
                    (f) => f.id === fontId
                  )?.family
                }
              />
            </div>

            {/* =================================================
                REAL LIFE PREVIEW
            ================================================= */}

            <div className="mt-10 w-full">
              <div className="mb-4 text-center">
                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.22em]
                  "
                  style={{
                    color: "#DE4B33",
                  }}
                >
                  in real life
                </p>

                <h3
                  className="
                    mt-1
                    text-xl
                    font-semibold
                  "
                  style={{
                    color: "#000000",
                  }}
                >
                  This is how it will look
                </h3>
              </div>

              <div
                className="
                  overflow-hidden
                  rounded-2xl
                "
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={selectedSize.reference}
                  alt="How it looks in real life"
                  className="w-full"
                />
              </div>
            </div>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <div
              className="
                mt-6
                w-full
                rounded-2xl
                p-5
              "
              style={{
                backgroundColor: "#EFE3C4",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="
                      text-[10px]
                      uppercase
                      tracking-[0.18em]
                    "
                    style={{
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    {selectedSize.label}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                    "
                    style={{
                      color: "#000000",
                    }}
                  >
                    {scent || "Custom candle"}
                  </p>
                </div>

                <p
                  className="
                    text-xl
                    font-semibold
                  "
                  style={{
                    color: "#000000",
                  }}
                >
                  {selectedSize.price} LE
                </p>
              </div>

              {!photoUrl && (
                <p
                  className="mt-2 text-center text-xs"
                  style={{
                    color: "rgba(0,0,0,0.55)",
                  }}
                >
                  Add your photo to continue.
                </p>
              )}
            </div>
<div className="mt-5 flex w-full gap-3">
  <button
    type="button"
    onClick={() => addCandleToCart(false)}
    disabled={uploading || rendering || !photoUrl}
    className="flex-1 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    style={{
      backgroundColor: "#FFFFFF",
      color: "#000000",
      border: "1px solid rgba(0,0,0,0.12)",
    }}
  >
    {rendering
      ? "Preparing..."
      : added
      ? "Added to cart"
      : "Add to cart"}
  </button>

  <button
    type="button"
    onClick={() => addCandleToCart(true)}
    disabled={uploading || rendering || !photoUrl}
    className="flex-1 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    style={{
      backgroundColor: "#DE4B33",
      color: "#FFF4E6",
    }}
  >
    {rendering ? "Preparing..." : "Buy now"}
  </button>
</div>
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   STEP LABEL
===================================================== */

function StepLabel({
  n,
  title,
}: {
  n: number;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className="
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          text-[11px]
          font-semibold
        "
        style={{
          backgroundColor: "#DE4B33",
          color: "#FFF4E6",
        }}
      >
        {n}
      </span>

      <span
        className="
          text-[11px]
          font-medium
          uppercase
          tracking-[0.15em]
        "
        style={{
          color: "#000000",
        }}
      >
        {title}
      </span>
    </div>
  );
}