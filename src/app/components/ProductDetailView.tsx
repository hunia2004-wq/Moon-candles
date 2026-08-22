"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/lib/supabase/types";

type OrderLine = {
  id: string;
  colorName: string;
  scentName: string | null;
  price: number;
  quantity: number;
  image: string;
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

const CUSTOMIZE_ONLY_NAMES = ["Fan", "Mini Candles"];

const QUACK_AND_KISS_NAMES = ["Quack and Kiss"];

const TWO_COLOR_PRODUCTS = ["Noor Al Qamar", "Noor El Kamar"];

export default function ProductDetailView({
  product,
  isMenuOpen = false,
}: {
  product: Product;
  isMenuOpen?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedColor = searchParams.get("color");

  const isGiveaway = GIVEAWAY_NAMES.includes(product.name);
  const isQuackAndKiss = QUACK_AND_KISS_NAMES.includes(product.name);
  const isTwoColorProduct = TWO_COLOR_PRODUCTS.includes(product.name);

  const accent = isGiveaway ? "#6E86C7" : "#D8A1AF";
  const accentDark = isGiveaway ? "#5A70B0" : "#B5798A";

  const customizeRoute = CUSTOMIZE_ROUTES[product.name];
  const customizeOnly = CUSTOMIZE_ONLY_NAMES.includes(product.name);

  const initialColorIndex = Math.max(
    0,
    product.colors?.findIndex((c) => c.name === preselectedColor) ?? 0
  );

  const [selectedColorIndex, setSelectedColorIndex] = useState(
    initialColorIndex === -1 ? 0 : initialColorIndex
  );

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedScent, setSelectedScent] = useState<string | null>(
    product.scents?.[0] ?? null
  );

  const [quantity, setQuantity] = useState(1);

  // Noor El Qamar — two color variants, each with its own quantity
  const [selectedNoorWhite, setSelectedNoorWhite] = useState(false);
  const [selectedNoorGray, setSelectedNoorGray] = useState(false);
  const [noorWhiteQuantity, setNoorWhiteQuantity] = useState(1);
  const [noorGrayQuantity, setNoorGrayQuantity] = useState(1);

  // Quack and Kiss — bride/groom duck, each with its own quantity
  const [selectedBride, setSelectedBride] = useState(false);
  const [selectedGroom, setSelectedGroom] = useState(false);
  const [brideQuantity, setBrideQuantity] = useState(1);
  const [groomQuantity, setGroomQuantity] = useState(1);

  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  const hasColors = (product.colors?.length ?? 0) > 0;
  const selectedColor = product.colors?.[selectedColorIndex];
  const hasOptions = !!selectedColor?.options?.length;
  const selectedOption = hasOptions
    ? selectedColor!.options![selectedOptionIndex]
    : undefined;

  const displayPrice =
    selectedOption?.price ?? selectedColor?.price ?? product.price;

  const gallery = hasOptions
    ? selectedOption?.image_urls?.length
      ? selectedOption.image_urls
      : [selectedOption?.image_url].filter(Boolean)
    : hasColors
    ? selectedColor?.image_urls?.length
      ? selectedColor.image_urls
      : [selectedColor?.image_url].filter(Boolean)
    : product.image_urls ?? [];

  const displayImage = gallery[selectedImageIndex] ?? gallery[0];

  function createLineId(colorName: string, scentName: string | null): string {
    return [product.id, colorName || "default", scentName || "unscented"]
      .join("-")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (isTwoColorProduct) {
        const whiteItem = existingCart.find(
          (item: any) =>
            item.productId === product.id &&
            item.productName === product.name &&
            item.color === "White"
        );

        const grayItem = existingCart.find(
          (item: any) =>
            item.productId === product.id &&
            item.productName === product.name &&
            item.color === "Gray"
        );

        if (whiteItem) {
          setSelectedNoorWhite(true);
          setNoorWhiteQuantity(Number(whiteItem.quantity) || 1);
        }

        if (grayItem) {
          setSelectedNoorGray(true);
          setNoorGrayQuantity(Number(grayItem.quantity) || 1);
        }

        return;
      }

      if (isQuackAndKiss) {
        const brideItem = existingCart.find(
          (item: any) =>
            item.productId === product.id &&
            item.productName === product.name &&
            item.color === "Bride"
        );

        const groomItem = existingCart.find(
          (item: any) =>
            item.productId === product.id &&
            item.productName === product.name &&
            item.color === "Groom"
        );

        if (brideItem) {
          setSelectedBride(true);
          setBrideQuantity(Number(brideItem.quantity) || 1);
        }

        if (groomItem) {
          setSelectedGroom(true);
          setGroomQuantity(Number(groomItem.quantity) || 1);
        }

        return;
      }

      const productItems = existingCart.filter(
        (item: any) =>
          item.productId === product.id && item.productName === product.name
      );

      const lines: OrderLine[] = productItems.map((item: any) => {
        const colorName = item.color ?? product.name;
        const scentName = item.scent ?? null;

        return {
          id: item.id || createLineId(colorName, scentName),
          colorName,
          scentName,
          price: Number(item.price) || Number(product.price),
          quantity: Number(item.quantity) || 1,
          image: item.image ?? "",
        };
      });

      setOrderLines(lines);
    } catch {
      setOrderLines([]);
    }
  }, [product.id, product.name, isTwoColorProduct, isQuackAndKiss]);

  useEffect(() => {
    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  /* ------------------------------------------------------------------ */
  /*  Noor El Qamar — White / Gray                                       */
  /* ------------------------------------------------------------------ */

  function addNoorWhiteToCart() {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = existingCart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        item.productName === product.name &&
        item.color === "White"
    );

    const newItem = {
      id: `${product.id}-white`,
      productId: product.id,
      productName: product.name,
      price: Number(displayPrice),
      quantity: noorWhiteQuantity,
      scent: null,
      color: "White",
      image: displayImage ?? "",
    };

    const updatedCart = [...existingCart];

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], ...newItem };
    } else {
      updatedCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedNoorWhite(true);

    setOrderLines((prev) => {
      const id = `${product.id}-white`;
      const existingLineIndex = prev.findIndex((line) => line.id === id);

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          quantity: noorWhiteQuantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "White",
          scentName: null,
          price: Number(displayPrice),
          quantity: noorWhiteQuantity,
          image: displayImage ?? "",
        },
      ];
    });
  }

  function addNoorGrayToCart() {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = existingCart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        item.productName === product.name &&
        item.color === "Gray"
    );

    const newItem = {
      id: `${product.id}-gray`,
      productId: product.id,
      productName: product.name,
      price: Number(displayPrice),
      quantity: noorGrayQuantity,
      scent: null,
      color: "Gray",
      image: displayImage ?? "",
    };

    const updatedCart = [...existingCart];

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], ...newItem };
    } else {
      updatedCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedNoorGray(true);

    setOrderLines((prev) => {
      const id = `${product.id}-gray`;
      const existingLineIndex = prev.findIndex((line) => line.id === id);

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          quantity: noorGrayQuantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Gray",
          scentName: null,
          price: Number(displayPrice),
          quantity: noorGrayQuantity,
          image: displayImage ?? "",
        },
      ];
    });
  }

  function removeNoorColor(color: "White" | "Gray") {
    const id = `${product.id}-${color.toLowerCase()}`;
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.filter((item: any) => item.id !== id);

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setOrderLines((prev) => prev.filter((line) => line.id !== id));

    if (color === "White") {
      setSelectedNoorWhite(false);
      setNoorWhiteQuantity(1);
    }

    if (color === "Gray") {
      setSelectedNoorGray(false);
      setNoorGrayQuantity(1);
    }
  }

  function updateNoorQuantity(color: "White" | "Gray", newQuantity: number) {
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

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: safeQuantity } : line
      )
    );

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.map((item: any) =>
      item.id === id ? { ...item, quantity: safeQuantity } : item
    );

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  /* ------------------------------------------------------------------ */
  /*  Quack and Kiss — Bride / Groom duck                                 */
  /* ------------------------------------------------------------------ */

  function addBrideToCart() {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = existingCart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        item.productName === product.name &&
        item.color === "Bride"
    );

    const newItem = {
      id: `${product.id}-bride`,
      productId: product.id,
      productName: product.name,
      price: Number(displayPrice),
      quantity: brideQuantity,
      scent: null,
      color: "Bride",
      image: displayImage ?? "",
    };

    const updatedCart = [...existingCart];

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], ...newItem };
    } else {
      updatedCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedBride(true);

    setOrderLines((prev) => {
      const id = `${product.id}-bride`;
      const existingLineIndex = prev.findIndex((line) => line.id === id);

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          quantity: brideQuantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Bride",
          scentName: null,
          price: Number(displayPrice),
          quantity: brideQuantity,
          image: displayImage ?? "",
        },
      ];
    });
  }

  function addGroomToCart() {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = existingCart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        item.productName === product.name &&
        item.color === "Groom"
    );

    const newItem = {
      id: `${product.id}-groom`,
      productId: product.id,
      productName: product.name,
      price: Number(displayPrice),
      quantity: groomQuantity,
      scent: null,
      color: "Groom",
      image: displayImage ?? "",
    };

    const updatedCart = [...existingCart];

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], ...newItem };
    } else {
      updatedCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setSelectedGroom(true);

    setOrderLines((prev) => {
      const id = `${product.id}-groom`;
      const existingLineIndex = prev.findIndex((line) => line.id === id);

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          quantity: groomQuantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id,
          colorName: "Groom",
          scentName: null,
          price: Number(displayPrice),
          quantity: groomQuantity,
          image: displayImage ?? "",
        },
      ];
    });
  }

  function removeDuck(type: "Bride" | "Groom") {
    const id = `${product.id}-${type.toLowerCase()}`;
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.filter((item: any) => item.id !== id);

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setOrderLines((prev) => prev.filter((line) => line.id !== id));

    if (type === "Bride") {
      setSelectedBride(false);
      setBrideQuantity(1);
    }

    if (type === "Groom") {
      setSelectedGroom(false);
      setGroomQuantity(1);
    }
  }

  function updateDuckQuantity(type: "Bride" | "Groom", newQuantity: number) {
    if (newQuantity <= 0) {
      removeDuck(type);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);
    const id = `${product.id}-${type.toLowerCase()}`;

    if (type === "Bride") {
      setBrideQuantity(safeQuantity);
    } else {
      setGroomQuantity(safeQuantity);
    }

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: safeQuantity } : line
      )
    );

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.map((item: any) =>
      item.id === id ? { ...item, quantity: safeQuantity } : item
    );

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  /* ------------------------------------------------------------------ */
  /*  Normal candles / regular products                                  */
  /* ------------------------------------------------------------------ */

  function addRegularProductToCart() {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const productColor = selectedColor?.name ?? product.name;
    const productScent = selectedScent ?? null;
    const lineId = createLineId(productColor, productScent);

    const existingIndex = existingCart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        item.productName === product.name &&
        (item.color ?? product.name) === productColor &&
        (item.scent ?? null) === productScent
    );

    const newQuantity =
      existingIndex !== -1
        ? Number(existingCart[existingIndex].quantity) || 1
        : 1;

    const newItem = {
      id: lineId,
      productId: product.id,
      productName: product.name,
      price: Number(displayPrice),
      quantity: newQuantity,
      scent: productScent,
      color: productColor,
      image: displayImage ?? "",
    };

    const updatedCart = [...existingCart];

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = { ...updatedCart[existingIndex], ...newItem };
    } else {
      updatedCart.push(newItem);
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setOrderLines((prev) => {
      const existingLineIndex = prev.findIndex((line) => line.id === lineId);

      if (existingLineIndex !== -1) {
        const updated = [...prev];
        updated[existingLineIndex] = {
          ...updated[existingLineIndex],
          colorName: productColor,
          scentName: productScent,
          price: Number(displayPrice),
          quantity: newQuantity,
          image: displayImage ?? "",
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
          quantity: newQuantity,
          image: displayImage ?? "",
        },
      ];
    });
  }

  function updateNormalLineQuantity(lineId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeLine(lineId);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: safeQuantity } : line
      )
    );

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.map((item: any) =>
      item.id === lineId ? { ...item, quantity: safeQuantity } : item
    );

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function removeLine(id: string) {
    setOrderLines((prev) => prev.filter((line) => line.id !== id));

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.filter((item: any) => item.id !== id);

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  const totalQuantity = orderLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalOrderPrice = orderLines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );

  return (
    <div
      className="flex flex-1 flex-col items-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
  {!isMenuOpen && (
  <button
    onClick={() => router.back()}
    aria-label="Go back"
    className="group fixed left-5 top-24 z-40 flex items-center justify-center md:left-10 md:top-28"
    style={{ color: "#000000" }}
  >
    <ArrowLeft
      size={26}
      strokeWidth={1.7}
      className="transition-transform duration-200 group-hover:-translate-x-1"
    />
  </button>
)}

      <main className="grid w-full max-w-6xl grid-cols-1 items-start gap-8 px-6 py-16 md:grid-cols-[180px_1fr_1fr] md:gap-10 md:px-16">
        {/* COLOR OPTIONS */}
        {hasColors && !isTwoColorProduct && (
          <div className="order-2 flex flex-row flex-wrap justify-center gap-2 md:order-1 md:flex-col md:justify-start md:pt-24">
            <p
              className="mb-1 hidden text-xs font-semibold uppercase tracking-[0.15em] md:block"
              style={{ color: accent }}
            >
              Options
            </p>

            {product.colors.map((color, index) => {
              const swatchImg = color.options?.[0]?.image_url ?? color.image_url;

              return (
                <button
                  key={`${color.name}-${index}`}
                  onClick={() => setSelectedColorIndex(index)}
                  title={color.name}
                  className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 shadow-sm transition-all duration-150 hover:scale-110 active:scale-95"
                  style={{
                    borderColor: index === selectedColorIndex ? accent : "transparent",
                    backgroundColor: color.hex ?? "#ccc",
                    boxShadow:
                      index === selectedColorIndex
                        ? "0 0 0 3px rgba(71,104,75,0.15)"
                        : "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {swatchImg && (
                    <img src={swatchImg} alt={color.name} className="h-full w-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* PRODUCT IMAGE */}
        <div className="order-1 flex w-full flex-col items-center gap-3 md:order-2">
         

          <h1
            className="text-center text-2xl font-bold uppercase leading-tight tracking-wide md:text-4xl"
            style={{ color: "#000000" }}
          >
            {product.name}
          </h1>

          <div className="relative flex aspect-square w-full max-w-sm items-center justify-center">
            <div
              className="absolute h-[80%] w-[80%] rounded-full opacity-60 blur-3xl"
              style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
            />

            <div
              className="relative flex h-full w-full items-center justify-center rounded-3xl p-6"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 20px 40px rgba(70,85,61,0.15)" }}
            >
              {displayImage && (
                <img
                  src={displayImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>

          {/* GALLERY */}
          {gallery.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {gallery.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: index === selectedImageIndex ? accent : "transparent",
                  }}
                >
                  <img
                    src={url}
                    alt={`${product.name} option ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* SELECTED COLOR */}
          {hasColors && selectedColor && !isTwoColorProduct && (
            <span
              className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "#FFFFFF", color: accent }}
            >
              {selectedColor.name}
            </span>
          )}

          {/* OPTIONS */}
          {hasOptions && !isTwoColorProduct && (
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {selectedColor!.options!.map((option, index) => {
                const isSelected = index === selectedOptionIndex;

                return (
                  <button
                    key={`${option.name}-${index}`}
                    onClick={() => {
                      setSelectedOptionIndex(index);
                      setSelectedImageIndex(0);
                    }}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? accent : "#FFFFFF",
                      color: isSelected ? "#FFF4E6" : accent,
                      border: `1px solid ${accent}`,
                    }}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}
        <div
          className="order-3 flex w-full flex-col rounded-3xl p-6 text-center md:p-8 md:text-left"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 12px 30px rgba(110,134,199,0.08)" }}
        >
          {product.size_ml && (
            <span
              className="self-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide md:self-start"
              style={{ backgroundColor: "#efe3c4", color: accent }}
            >
              {product.size_ml} ml
            </span>
          )}

          {product.description && (
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "#000000", opacity: 0.75 }}
            >
              {product.description}
            </p>
          )}

          <p className="mt-6 text-3xl font-bold" style={{ color: accent }}>
            {displayPrice} <span className="text-lg font-medium">EGP</span>
          </p>

          <div className="mt-4 h-px w-full" style={{ backgroundColor: "#efe3c4" }} />

          {/* =====================================================
              NOOR EL QAMAR — White / Gray
             ===================================================== */}
          {!customizeOnly && isTwoColorProduct && (
            <div className="mt-8">
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedNoorWhite) return;
                    addNoorWhiteToCart();
                  }}
                  className="flex-1 rounded-xl border px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: selectedNoorWhite ? "#FFFFFF" : "#F3F3F3",
                    color: "#000000",
                    borderColor: selectedNoorWhite ? "#000000" : "#D8D8D8",
                    boxShadow: selectedNoorWhite ? "0 4px 12px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  White
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedNoorGray) return;
                    addNoorGrayToCart();
                  }}
                  className="flex-1 rounded-xl border px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: selectedNoorGray ? "#808080" : "#F3F3F3",
                    color: selectedNoorGray ? "#FFFFFF" : "#000000",
                    borderColor: selectedNoorGray ? "#606060" : "#D8D8D8",
                    boxShadow: selectedNoorGray ? "0 4px 12px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  Gray
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {selectedNoorWhite && (
                  <div className="rounded-xl px-4 py-4" style={{ backgroundColor: "#efe3c4" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-black/20"
                          style={{ backgroundColor: "#FFFFFF" }}
                        />
                        <p className="text-sm font-semibold">White</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateNoorQuantity("White", noorWhiteQuantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {noorWhiteQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateNoorQuantity("White", noorWhiteQuantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNoorColor("White")}
                          className="ml-2 text-xs underline transition-opacity hover:opacity-100"
                          style={{ color: "#000000", opacity: 0.5 }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedNoorGray && (
                  <div className="rounded-xl px-4 py-4" style={{ backgroundColor: "#efe3c4" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-black/20"
                          style={{ backgroundColor: "#808080" }}
                        />
                        <p className="text-sm font-semibold">Gray</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateNoorQuantity("Gray", noorGrayQuantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {noorGrayQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateNoorQuantity("Gray", noorGrayQuantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNoorColor("Gray")}
                          className="ml-2 text-xs underline transition-opacity hover:opacity-100"
                          style={{ color: "#000000", opacity: 0.5 }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {orderLines.length > 0 && (
                <div
                  className="mt-4 flex items-center justify-between rounded-xl px-4 py-4"
                  style={{ backgroundColor: "#FFFFFF", border: `1px solid ${accent}` }}
                >
                  <span className="text-sm font-semibold">
                    {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} total
                  </span>
                  <span className="text-lg font-bold" style={{ color: accent }}>
                    {totalOrderPrice} EGP
                  </span>
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              SCENTS
             ===================================================== */}
          {!customizeOnly && !isGiveaway && !isTwoColorProduct && !isQuackAndKiss && (
            <div className="mt-6">
              {product.scents?.length > 0 ? (
                <>
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.15em]"
                    style={{ color: accent }}
                  >
                    Scent: {selectedScent}
                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {product.scents.map((scent, index) => {
                      const isSelected = scent === selectedScent;

                      return (
                        <button
                          key={`${scent}-${index}`}
                          type="button"
                          onClick={() => setSelectedScent(scent)}
                          className="rounded-full px-3 py-2 text-center text-xs font-medium uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                          style={{
                            backgroundColor: isSelected ? accent : "#ffffff",
                            color: isSelected ? "#FFF4E6" : "#000000",
                            border: isSelected ? "none" : `1px solid ${accent}`,
                          }}
                        >
                          {scent}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <span
                  className="inline-block rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: "#efe3c4", color: accent }}
                >
                  Unscented
                </span>
              )}
            </div>
          )}

          {/* =====================================================
              QUACK AND KISS — Bride / Groom
             ===================================================== */}
          {!customizeOnly && isQuackAndKiss && (
            <div className="mt-8">
              <div className="flex w-full gap-3">
                                <button
                  type="button"
                  onClick={() => {
                    if (selectedBride) return;
                    addBrideToCart();
                  }}
                  className="flex-1 rounded-xl border px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: selectedBride ? "#D8A1AF" : "#F3F3F3",
                    color: selectedBride ? "#FFF4E6" : "#000000",
                    borderColor: selectedBride ? "#D8A1AF" : "#D8D8D8",
                    boxShadow: selectedBride ? "0 4px 12px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  Bride Duck
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedGroom) return;
                    addGroomToCart();
                  }}
                  className="flex-1 rounded-xl border px-5 py-4 text-sm font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: selectedGroom ? "#6E86C7" : "#F3F3F3",
                    color: selectedGroom ? "#FFF4E6" : "#000000",
                    borderColor: selectedGroom ? "#6E86C7" : "#D8D8D8",
                    boxShadow: selectedGroom ? "0 4px 12px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  Groom Duck
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {selectedBride && (
                  <div className="rounded-xl px-4 py-4" style={{ backgroundColor: "#efe3c4" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                                               <span
                          className="h-4 w-4 rounded-full border border-black/20"
                          style={{ backgroundColor: "#D8A1AF" }}
                        />
                        <p className="text-sm font-semibold">Bride Duck</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateDuckQuantity("Bride", brideQuantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {brideQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDuckQuantity("Bride", brideQuantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDuck("Bride")}
                          className="ml-2 text-xs underline transition-opacity hover:opacity-100"
                          style={{ color: "#000000", opacity: 0.5 }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGroom && (
                  <div className="rounded-xl px-4 py-4" style={{ backgroundColor: "#efe3c4" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                                                <span
                          className="h-4 w-4 rounded-full border border-black/20"
                          style={{ backgroundColor: "#6E86C7" }}
                        />
                        <p className="text-sm font-semibold">Groom Duck</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateDuckQuantity("Groom", groomQuantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {groomQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDuckQuantity("Groom", groomQuantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDuck("Groom")}
                          className="ml-2 text-xs underline transition-opacity hover:opacity-100"
                          style={{ color: "#000000", opacity: 0.5 }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {orderLines.length > 0 && (
                <div
                  className="mt-4 flex items-center justify-between rounded-xl px-4 py-4"
                  style={{ backgroundColor: "#FFFFFF", border: `1px solid ${accent}` }}
                >
                  <span className="text-sm font-semibold">
                    {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} total
                  </span>
                  <span className="text-lg font-bold" style={{ color: accent }}>
                    {totalOrderPrice} EGP
                  </span>
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              NORMAL CANDLES
             ===================================================== */}
          {!customizeOnly && !isGiveaway && !isQuackAndKiss && !isTwoColorProduct && (
            <>
              <button
                type="button"
                onClick={addRegularProductToCart}
                className="mt-8 w-full rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ backgroundColor: accent, color: "#FFF4E6" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent)}
              >
                Add to Cart
              </button>

              {orderLines.length > 0 && (
                <div className="mt-6 text-left">
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
                    style={{ color: accent }}
                  >
                    Your Order
                  </p>

                  <div className="flex flex-col gap-3">
                    {orderLines.map((line, index) => (
                      <div
                        key={`order-${line.id}-${index}`}
                        className="rounded-xl px-4 py-4"
                        style={{ backgroundColor: "#efe3c4" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                              {line.colorName}
                            </p>
                            {line.scentName && (
                              <p className="mt-1 text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
                                {line.scentName}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateNormalLineQuantity(line.id, line.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                              style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                            >
                              −
                            </button>
                            <span
                              className="w-5 text-center text-sm font-semibold"
                              style={{ color: "#000000" }}
                            >
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateNormalLineQuantity(line.id, line.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-110 active:scale-95"
                              style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                            >
                              +
                            </button>
                            <span
                              className="ml-1 min-w-[75px] text-right text-sm font-semibold"
                              style={{ color: accent }}
                            >
                              {line.price * line.quantity} EGP
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-xs underline"
                            style={{ color: "#000000", opacity: 0.5 }}
                          >
                            remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-3 flex items-center justify-between rounded-xl px-4 py-4"
                    style={{ backgroundColor: "#FFFFFF", border: `1px solid ${accent}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                      {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} total
                    </span>
                    <span className="text-lg font-bold" style={{ color: accent }}>
                      {totalOrderPrice} EGP
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* =====================================================
              CUSTOMIZE
             ===================================================== */}
          {customizeRoute && (
            <button
              type="button"
              onClick={() => router.push(customizeRoute)}
              className="mt-3 w-full rounded-full px-8 py-3.5 text-base font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
              style={{ backgroundColor: "transparent", color: accent, border: `1.5px solid ${accent}` }}
            >
              Customize Your {product.name}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}