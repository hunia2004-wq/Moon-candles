"use client";

import { useState, useRef, useEffect } from "react";
import {
  Great_Vibes,
  Dancing_Script,
  Playfair_Display,
  Caveat,
  Lora,
} from "next/font/google";

import { useLayerGestures } from "../../components/useLayerGestures";
import {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/cart";

const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const dancing = Dancing_Script({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"], style: "italic" });

const ACCENT = "#DE4B33";

const SIZES = [
  { id: "small", label: "17x25 CM", price: 25 },
  { id: "large", label: "20x29 CM", price: 35 },
] as const;

type SizeId = (typeof SIZES)[number]["id"];

const FAN_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customized%20fan/custom%20fan.png";

const PATTERN_SCALE_OPTS = { minScale: 1, maxScale: 6 };

const BG_SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "pill", label: "Pill" },
  { id: "circle", label: "Circle" },
  { id: "ribbon", label: "Ribbon" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "arch", label: "Arch" },
  { id: "heart", label: "Heart" },
  { id: "octagon", label: "Octagon" },
  { id: "cloud", label: "Cloud" },
] as const;

const TASSEL_COLORS = [
  { id: "orange", label: "Orange", hex: "#E8813C" },
  { id: "light-pink", label: "Light Pink", hex: "#F5C6D6" },
  { id: "green", label: "Green", hex: "#8FAA82" },
  { id: "light-blue", label: "Light Blue", hex: "#B9D9EC" },
  { id: "light-purple", label: "Light Purple", hex: "#C9B6E4" },
  { id: "purple", label: "Purple", hex: "#7B4B94" },
  { id: "red", label: "Red", hex: "#C0392B" },
  { id: "white", label: "White", hex: "#FFFFFF" },
] as const;

type TasselColorId = (typeof TASSEL_COLORS)[number]["id"];

const FONTS = [
  { id: "vibes", label: "Great Vibes", short: "Vibes", className: greatVibes.className, previewSize: 17 },
  { id: "dancing", label: "Dancing Script", short: "Dancing", className: dancing.className, previewSize: 16 },
  { id: "playfair", label: "Playfair Display", short: "Playfair", className: playfair.className, previewSize: 15 },
  { id: "caveat", label: "Caveat", short: "Hand", className: caveat.className, previewSize: 17 },
  { id: "lora", label: "Lora Italic", short: "Soft", className: lora.className, previewSize: 14 },
] as const;

type FontId = (typeof FONTS)[number]["id"];

function getFont(id: FontId) {
  return FONTS.find((f) => f.id === id)!;
}

type BaseLayer = {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

type TextLayer = BaseLayer & {
  type: "text";
  role: "monogram" | "message";
  content: string;
  fontSize: number;
  font: FontId;
  color: string;
  bgColor: string | null;
  bgShape: (typeof BG_SHAPES)[number]["id"];
};

type PatternLayer = BaseLayer & {
  type: "pattern";
  src: string;
  tint: string | null;
};

type FillLayer = BaseLayer & {
  type: "fill";
  colors: string[];
};

type Layer = TextLayer | PatternLayer | FillLayer;

type SideId = "front" | "back";
type LayersBySide = Record<SideId, Layer[]>;

type FanOrderLine = {
  id: string;
  size: SizeId;
  tasselColor: TasselColorId;
  quantity: number;
  inCart: boolean;
  layersBySide: LayersBySide;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultLayersForSide(): Layer[] {
  return [];
}

function ColorWheelPicker({
  value,
  onChange,
  size = 26,
}: {
  value: string;
  onChange: (color: string) => void;
  size?: number;
}) {
  return (
    <label
      className="relative inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
      }}
      title="Choose any color"
    >
      <span
        className="rounded-full"
        style={{
          width: size - 8,
          height: size - 8,
          backgroundColor: value,
          boxShadow: "0 0 0 1.5px #FFFFFF",
        }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function FontPicker({
  value,
  previewText,
  onChange,
}: {
  value: FontId;
  previewText: string;
  onChange: (fontId: FontId) => void;
}) {
  const text = previewText.trim() || "Aa";

  return (
    <div className="grid grid-cols-5 gap-1">
      {FONTS.map((f) => {
        const isActive = value === f.id;
        return (
          <button
            type="button"
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`${f.className} flex items-center justify-center rounded-lg px-1 py-2 transition-all duration-150 hover:scale-[1.05] active:scale-[0.95]`}
            style={{
              backgroundColor: isActive ? ACCENT : "#FFFFFF",
              border: `1px solid ${isActive ? ACCENT : "rgba(0,0,0,0.15)"}`,
            }}
            title={f.label}
          >
            <span
              className="leading-none"
              style={{
                fontSize: Math.min(f.previewSize, 14),
                color: isActive ? "#FFF4E6" : "#000000",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function CustomizeFanPage() {
  const [size, setSize] = useState<SizeId>("small");
  const [activeSide, setActiveSide] = useState<SideId>("front");
  const [designMode, setDesignMode] = useState<"upload" | "build" | null>(null);

  const [layersBySide, setLayersBySide] = useState<LayersBySide>({
    front: defaultLayersForSide(),
    back: defaultLayersForSide(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedTassel, setSelectedTassel] = useState<TasselColorId>(TASSEL_COLORS[0].id);
  const [fanOrderLines, setFanOrderLines] = useState<FanOrderLine[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const nextZ = useRef(1);
  const patternFileInputRef = useRef<HTMLInputElement>(null);
  const cartSnapshotRef = useRef<string>("");

  const selectedSize = SIZES.find((s) => s.id === size)!;
  const layers = layersBySide[activeSide];

  function setLayers(updater: (prev: Layer[]) => Layer[]) {
    setLayersBySide((prev) => ({
      ...prev,
      [activeSide]: updater(prev[activeSide]),
    }));
  }

  const gestures = useLayerGestures(layers, setLayers, setSelectedId);

  const hasBackground = layers.some((l) => l.type === "fill" || l.type === "pattern");
  const otherSide: SideId = activeSide === "front" ? "back" : "front";

  /* -------------------------------------------------------------- */
  /* CART SYNC                                                      */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    function syncFanOrderWithCart() {
      const cart = getCart();
      const cartFanLines = cart.filter(
        (item) => item.productId === "fan" && item.customization?.type === "customized-fan"
      );
      const cartById = new Map(cartFanLines.map((item) => [item.id, item]));

      try {
        cartSnapshotRef.current = JSON.stringify(cart);
      } catch {
        cartSnapshotRef.current = "";
      }

      setFanOrderLines((prev) =>
        prev
          .map((line) => {
            if (!line.inCart) return line;
            const cartItem = cartById.get(line.id);
            if (!cartItem) return null;
            const customization = cartItem.customization;
            if (!customization || customization.type !== "customized-fan") return null;
            return {
              ...line,
              quantity: cartItem.quantity,
              layersBySide: customization.layersBySide ?? line.layersBySide,
            };
          })
          .filter((line): line is FanOrderLine => line !== null)
      );
    }

    function handleCartUpdated() {
      syncFanOrderWithCart();
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === "cart") syncFanOrderWithCart();
    }

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleStorage);
    syncFanOrderWithCart();

    const pollInterval = window.setInterval(() => {
      let currentSnapshot = "";
      try {
        currentSnapshot = JSON.stringify(getCart());
      } catch {
        currentSnapshot = "";
      }
      if (currentSnapshot !== cartSnapshotRef.current) syncFanOrderWithCart();
    }, 150);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    const cart = getCart();
    const existingFanLines: FanOrderLine[] = cart
      .filter((item) => item.productId === "fan" && item.customization?.type === "customized-fan")
      .map((item) => {
        const customization = item.customization;
        if (!customization || customization.type !== "customized-fan") return null;
        return {
          id: item.id,
          size: customization.size as SizeId,
          tasselColor: customization.tasselColor as TasselColorId,
          quantity: item.quantity,
          inCart: true,
          layersBySide: customization.layersBySide ?? {
            front: defaultLayersForSide(),
            back: defaultLayersForSide(),
          },
        };
      })
      .filter((line): line is FanOrderLine => line !== null);

    if (existingFanLines.length === 0) return;

    setFanOrderLines((prev) => {
      const existingIds = new Set(prev.map((line) => line.id));
      return [...prev, ...existingFanLines.filter((line) => !existingIds.has(line.id))];
    });

    const firstFan = existingFanLines[0];
    if (firstFan.layersBySide) setLayersBySide(firstFan.layersBySide);
    setSize(firstFan.size);
    setSelectedTassel(firstFan.tasselColor);
  }, []);

  /* -------------------------------------------------------------- */
  /* LAYER ACTIONS                                                  */
  /* -------------------------------------------------------------- */

  function addText(role: "monogram" | "message") {
    const id = makeId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        role,
        content: role === "monogram" ? "Y & J" : "Your message",
        fontSize: role === "monogram" ? 20 : 13,
        font: role === "monogram" ? "playfair" : "dancing",
        color: "#000000",
        bgColor: "#FFFFFF",
        bgShape: "rectangle",
        x: 50,
        y: role === "monogram" ? 42 : 70,
        scale: 1,
        rotation: 0,
        z: nextZ.current++,
      },
    ]);
    setSelectedId(id);
  }

  function addFill() {
    if (hasBackground) return;
    const id = makeId();
    setLayers((prev) => [
      ...prev,
      { id, type: "fill", colors: [ACCENT], x: 50, y: 50, scale: 1, rotation: 0, z: 0 },
    ]);
    setSelectedId(id);
  }

  function handlePatternUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (hasBackground) {
      alert("Please delete the existing background before adding a new one.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image under 8MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const id = makeId();
    setLayers((prev) => [
      ...prev,
      { id, type: "pattern", src: url, tint: null, x: 50, y: 50, scale: 1, rotation: 0, z: 0 },
    ]);
    setSelectedId(id);
    e.target.value = "";
  }

  function applyToBothSides(layer: Layer) {
    const copy = { ...layer, id: makeId(), z: layer.type === "text" ? nextZ.current++ : 0 } as Layer;
    setLayersBySide((prev) => ({
      ...prev,
      [otherSide]:
        layer.type === "text"
          ? [...prev[otherSide], copy]
          : [...prev[otherSide].filter((l) => l.type !== layer.type), copy],
    }));
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    gestures.pushHistory();
    setLayers((prev) => prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function addFillColor(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id && l.type === "fill" ? { ...l, colors: [...l.colors, "#FFFFFF"] } : l))
    );
  }

  function updateFillColor(id: string, index: number, color: string) {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.type !== "fill") return l;
        const colors = [...l.colors];
        colors[index] = color;
        return { ...l, colors };
      })
    );
  }

  function removeFillColor(id: string, index: number) {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.type !== "fill") return l;
        if (l.colors.length <= 1) return l;
        return { ...l, colors: l.colors.filter((_, i) => i !== index) };
      })
    );
  }

  /* -------------------------------------------------------------- */
  /* ORDER LINE ACTIONS                                             */
  /* -------------------------------------------------------------- */

  function addFanLineToOrder() {
    const lineId = makeId();
    const designSnapshot = structuredClone(layersBySide);

    setFanOrderLines((prev) => [
      ...prev,
      { id: lineId, size, tasselColor: selectedTassel, quantity: orderQuantity, inCart: false, layersBySide: designSnapshot },
    ]);
    setOrderQuantity(1);
  }

  function updateFanLineQuantity(lineId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeFanLine(lineId);
      return;
    }
    const safeQuantity = Math.max(1, newQuantity);
    const existingLine = fanOrderLines.find((l) => l.id === lineId);

    setFanOrderLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, quantity: safeQuantity } : line))
    );

    if (existingLine?.inCart) updateCartItemQuantity(lineId, safeQuantity);
  }

  function removeFanLine(lineId: string) {
    setFanOrderLines((prev) => prev.filter((line) => line.id !== lineId));
    removeCartItem(lineId);
  }

  function addFanToCart() {
    if (!fanOrderLines.length) return;

    const currentCart = getCart();

    fanOrderLines.forEach((line) => {
      const tasselLabel = TASSEL_COLORS.find((c) => c.id === line.tasselColor)!.label;
      const lineSize = SIZES.find((s) => s.id === line.size)!;
      const existing = currentCart.find((item) => item.id === line.id);

      if (existing) {
        updateCartItemQuantity(line.id, line.quantity);
        return;
      }

      addToCart({
        id: line.id,
        productId: "fan",
        productName: "Fan",
        price: lineSize.price,
        quantity: line.quantity,
        scent: null,
        color: `${lineSize.label} · ${tasselLabel} Tassel`,
        image: FAN_IMG,
        productRefId: 30,
        customization: {
          type: "customized-fan",
          size: line.size,
          tasselLabel,
          tasselColor: line.tasselColor,
          layersBySide: line.layersBySide,
        },
      });
    });

    setFanOrderLines((prev) => prev.map((line) => ({ ...line, inCart: true })));
    cartSnapshotRef.current = JSON.stringify(getCart());
    window.dispatchEvent(new Event("openCart"));
  }

  const totalQuantity = fanOrderLines.reduce((sum, l) => sum + l.quantity, 0);
  const totalOrderPrice = fanOrderLines.reduce(
    (sum, l) => sum + SIZES.find((s) => s.id === l.size)!.price * l.quantity,
    0
  );

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  /* -------------------------------------------------------------- */
  /* BACKGROUND SHAPE STYLE                                        */
  /* -------------------------------------------------------------- */

  function bgShapeStyle(shape: TextLayer["bgShape"], hasContent: boolean): React.CSSProperties {
    if (!hasContent) return {};
    switch (shape) {
      case "circle":
        return { borderRadius: "50%", aspectRatio: "1 / 1", padding: "18px 14px", display: "inline-flex", alignItems: "center", justifyContent: "center" };
      case "pill":
        return { borderRadius: 999, padding: "6px 16px" };
      case "ribbon":
        return { padding: "6px 22px", clipPath: "polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)" };
      case "diamond":
        return { aspectRatio: "1 / 1", padding: "22px 20px", display: "inline-flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" };
      case "hexagon":
        return { padding: "14px 22px", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" };
      case "arch":
        return { padding: "10px 18px 6px", borderRadius: "999px 999px 6px 6px" };
      case "heart":
        return { aspectRatio: "1 / 1", padding: "10px 16px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(50.0% 23.9%, 50.2% 22.2%, 51.5% 17.5%, 54.7% 11.3%, 60.2% 5.2%, 67.7% 1.0%, 76.5% 0.0%, 85.4% 2.7%, 93.0% 8.7%, 98.2% 17.3%, 100.0% 27.3%, 98.2% 37.7%, 93.0% 47.7%, 85.4% 57.2%, 76.5% 66.0%, 67.7% 74.4%, 60.2% 82.3%, 54.7% 89.3%, 51.5% 95.0%, 50.2% 98.7%, 50.0% 100.0%, 49.8% 98.7%, 48.5% 95.0%, 45.3% 89.3%, 39.8% 82.3%, 32.3% 74.4%, 23.5% 66.0%, 14.6% 57.2%, 7.0% 47.7%, 1.8% 37.7%, 0.0% 27.3%, 1.8% 17.3%, 7.0% 8.7%, 14.6% 2.7%, 23.5% 0.0%, 32.3% 1.0%, 39.8% 5.2%, 45.3% 11.3%, 48.5% 17.5%, 49.8% 22.2%)" };
      case "octagon":
        return { padding: "12px 16px", clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" };
      case "cloud":
        return { padding: "16px 20px", borderRadius: "40% 60% 55% 45% / 55% 45% 55% 45%" };
      case "rectangle":
      default:
        return { borderRadius: 8, padding: "4px 10px" };
    }
  }

  /* -------------------------------------------------------------- */
  /* RENDER LAYER                                                   */
  /* -------------------------------------------------------------- */

  function renderLayer(layer: Layer, interactive: boolean) {
    const isSelected = interactive && layer.id === selectedId;

    const frameStyle: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      outline: isSelected ? `1.5px dashed ${ACCENT}` : "none",
      outlineOffset: "4px",
      clipPath: "inset(0% 0% 24% 0%)",
    };

    const maskWrapperStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      WebkitMaskImage: `url(${FAN_IMG})`,
      maskImage: `url(${FAN_IMG})`,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      position: "relative",
      isolation: "isolate",
    };

    if (layer.type === "fill") {
      const background = layer.colors.length === 1 ? layer.colors[0] : `linear-gradient(135deg, ${layer.colors.join(", ")})`;
      return (
        <div key={layer.id} onClick={interactive ? () => setSelectedId(layer.id) : undefined} style={{ ...frameStyle, cursor: interactive ? "pointer" : "default" }}>
          <div style={{ ...maskWrapperStyle, background }} />
        </div>
      );
    }

    if (layer.type === "pattern") {
      const zoom = layer.scale;
      const maxPanPct = (zoom - 1) * 50;
      const offsetX = ((layer.x - 50) / 50) * maxPanPct;
      const offsetY = ((layer.y - 50) / 50) * maxPanPct;

      return (
        <div
          key={layer.id}
          onPointerDown={interactive ? gestures.onPointerDown(layer.id, stageRef.current, PATTERN_SCALE_OPTS) : undefined}
          onPointerMove={interactive ? gestures.onPointerMove(stageRef.current) : undefined}
          onPointerUp={interactive ? gestures.onPointerUp : undefined}
          onWheel={interactive ? gestures.onWheelZoom(layer.id, PATTERN_SCALE_OPTS) : undefined}
          style={{ ...frameStyle, cursor: interactive ? "grab" : "default", touchAction: "none" }}
        >
          <div style={maskWrapperStyle}>
            <img
              src={layer.src}
              alt="Your uploaded pattern"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`, transformOrigin: "center center" }}
            />
            {layer.tint && <div style={{ position: "absolute", inset: 0, backgroundColor: layer.tint, mixBlendMode: "color", opacity: 0.85 }} />}
          </div>
        </div>
      );
    }

    const commonStyle: React.CSSProperties = {
      position: "absolute",
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      transform: `translate(-50%, -50%) scale(${layer.scale})`,
      cursor: interactive ? "grab" : "default",
      outline: isSelected ? `1.5px dashed ${ACCENT}` : "none",
      outlineOffset: "4px",
      touchAction: interactive ? "none" : undefined,
    };

    const hasBg = !!layer.bgColor;
    const fontDef = getFont(layer.font);

    return (
      <div
        key={layer.id}
        onPointerDown={interactive ? gestures.onPointerDown(layer.id, stageRef.current) : undefined}
        onPointerMove={interactive ? gestures.onPointerMove(stageRef.current) : undefined}
        onPointerUp={interactive ? gestures.onPointerUp : undefined}
        onWheel={interactive ? gestures.onWheelZoom(layer.id) : undefined}
        className={fontDef.className}
        style={{
          ...commonStyle,
          fontSize: layer.fontSize,
          fontWeight: layer.role === "monogram" ? 700 : 500,
          color: layer.color,
          whiteSpace: "nowrap",
          backgroundColor: layer.bgColor ?? "transparent",
          boxShadow: hasBg ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
          textShadow: hasBg ? "none" : "0 1px 2px rgba(255,255,255,0.6)",
          ...bgShapeStyle(layer.bgShape, hasBg),
        }}
      >
        {layer.content}
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /* JSX                                                            */
  /* -------------------------------------------------------------- */

  return (
    <div style={{ backgroundColor: "#FFF4E6" }} className="w-full min-h-screen">
      <div className="flex flex-col items-center px-6 py-8">
        <div className="flex gap-2 mb-4">
          {(["front", "back"] as SideId[]).map((id) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                setActiveSide(id);
                setSelectedId(null);
              }}
              className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: activeSide === id ? ACCENT : "#FFFFFF",
                color: activeSide === id ? "#FFF4E6" : ACCENT,
                border: `1px solid ${ACCENT}`,
              }}
            >
              {id === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className="relative w-full max-w-[300px] md:max-w-[380px] touch-none select-none"
          onClick={(e) => {
            if (e.target === stageRef.current) setSelectedId(null);
          }}
        >
          <img src={FAN_IMG} alt={`Fan — ${activeSide}`} className="w-full h-auto pointer-events-none" draggable={false} />
          {layers.slice().sort((a, b) => a.z - b.z).map((layer) => renderLayer(layer, true))}
        </div>

        {selectedLayer && (
          <div className="mt-4 flex w-full max-w-[320px] flex-col gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#EFE3C4" }}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={gestures.undo}
                disabled={!gestures.canUndo()}
                className="text-left text-xs font-medium underline disabled:opacity-30"
                style={{ color: ACCENT }}
              >
                ↺ Undo
              </button>

              <button
                type="button"
                onClick={() => removeLayer(selectedLayer.id)}
                className="text-xs font-medium underline"
                style={{ color: "rgba(0,0,0,0.5)" }}
              >
                delete
              </button>
            </div>

            {selectedLayer.type === "text" && (
              <>
                <input
                  value={selectedLayer.content}
                  onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: `1px solid ${ACCENT}`, backgroundColor: "#FFFFFF", color: "#000000" }}
                  placeholder={selectedLayer.role === "monogram" ? "Your initials" : "Your message"}
                />

                <div>
                  <span className="mb-1.5 block text-[11px] font-medium" style={{ color: "rgba(0,0,0,0.55)" }}>
                    Font
                  </span>
                  <FontPicker value={selectedLayer.font} previewText={selectedLayer.content} onChange={(f) => updateLayer(selectedLayer.id, { font: f })} />
                </div>
              </>
            )}

            {selectedLayer.type === "fill" && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                  {selectedLayer.colors.length === 1 ? "Color" : "Colors (blended)"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedLayer.colors.map((c, i) => (
                    <div key={i} className="relative">
                      <ColorWheelPicker value={c} onChange={(newC) => updateFillColor(selectedLayer.id, i, newC)} />
                      {selectedLayer.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFillColor(selectedLayer.id, i)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                          style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addFillColor(selectedLayer.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-transform hover:scale-110"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                  Add more than one color to blend them together.
                </span>
              </div>
            )}

            {selectedLayer.type === "text" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                    Color
                  </span>
                  <ColorWheelPicker value={selectedLayer.color} onChange={(c) => updateLayer(selectedLayer.id, { color: c })} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                    Backing
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateLayer(selectedLayer.id, { bgColor: null })}
                      className="h-6 w-6 flex-shrink-0 rounded-full border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: "#FFFFFF",
                        backgroundImage: "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                        borderColor: selectedLayer.bgColor === null ? "#000000" : "rgba(0,0,0,0.3)",
                        borderWidth: selectedLayer.bgColor === null ? 2 : 1,
                      }}
                    />
                    <ColorWheelPicker value={selectedLayer.bgColor ?? "#FFFFFF"} onChange={(c) => updateLayer(selectedLayer.id, { bgColor: c })} />
                    <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.45)" }}>
                      any backing color
                    </span>
                  </div>
                </div>

                {selectedLayer.bgColor && (
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                      Shape
                    </span>
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {BG_SHAPES.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => updateLayer(selectedLayer.id, { bgShape: s.id })}
                          className="rounded-md px-2.5 py-1 text-[11px] transition-all"
                          style={{
                            backgroundColor: selectedLayer.bgShape === s.id ? ACCENT : "#FFFFFF",
                            color: selectedLayer.bgShape === s.id ? "#FFF4E6" : "rgba(0,0,0,0.6)",
                            border: `1px solid ${selectedLayer.bgShape === s.id ? ACCENT : "rgba(0,0,0,0.15)"}`,
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => applyToBothSides(selectedLayer)}
              className="w-full rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] hover:brightness-90"
              style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
            >
              Apply to both sides
            </button>
          </div>
        )}

        <p className="text-center text-[11px] mt-3 max-w-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
          Tap an item below to add it, then use one finger to move it and two fingers to pinch-zoom it into place on the {activeSide}.
        </p>
      </div>

      <div className="px-6 md:px-12 py-4 md:py-8 max-w-2xl mx-auto">
        <p className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3" style={{ color: ACCENT }}>
          made by you, for you
        </p>

        <h1 className="font-serif leading-[1.05] mb-4">
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: "#000000" }}>
            Customize
          </span>
          <span className="block text-3xl md:text-5xl font-bold" style={{ color: ACCENT }}>
            your fan
          </span>
        </h1>

        <p className="text-sm md:text-base mb-10" style={{ color: "rgba(0,0,0,0.62)" }}>
          A hand fan designed around you — pick a size, add a monogram or message, and finish it with a tassel
          color of your choice. A lovely, interactive keepsake for weddings and warm-weather celebrations.
        </p>

        <StepLabel n={1} title="Choose your size" />
        <div className="grid grid-cols-2 gap-3 mb-8">
          {SIZES.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSize(s.id)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md"
              style={{
                border: `1.5px solid ${size === s.id ? ACCENT : "rgba(0,0,0,0.12)"}`,
                backgroundColor: size === s.id ? "#EFE3C4" : "transparent",
              }}
            >
              <img src={FAN_IMG} alt="" className="object-contain" style={{ width: 28, height: 28 }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: "#000000" }}>
                {s.label}
              </span>
              <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.62)" }}>
                {s.price} LE
              </span>
            </button>
          ))}
        </div>

        <StepLabel n={2} title="Design the front & back (optional)" />

        {designMode === null ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setDesignMode("upload")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
              style={{ border: `1.5px dashed ${ACCENT}`, backgroundColor: "#EFE3C4" }}
            >
              <UploadIcon />
              <span className="text-xs font-semibold" style={{ color: "#000000" }}>
                Upload your own design
              </span>
              <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                One finished image, shaped to the fan
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDesignMode("build")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
              style={{ border: `1.5px dashed ${ACCENT}`, backgroundColor: "#EFE3C4" }}
            >
              <PaletteIcon />
              <span className="text-xs font-semibold" style={{ color: "#000000" }}>
                Design it here
              </span>
              <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>
                Color, photo, and message
              </span>
            </button>
          </div>
        ) : (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setDesignMode(designMode === "upload" ? "build" : "upload")}
              className="mb-3 text-[11px] font-medium underline"
              style={{ color: ACCENT }}
            >
              {designMode === "upload" ? "→ design it here instead" : "→ upload a different design instead"}
            </button>

            {designMode === "upload" && (
              <>
                {!hasBackground && (
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => patternFileInputRef.current?.click()}
                      className="flex-1 flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                      style={{ border: `1.5px dashed ${ACCENT}`, backgroundColor: "#EFE3C4" }}
                    >
                      <UploadIcon />
                      <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
                        Upload your own finished design
                        <br />
                        <span className="text-[11px]">
                          It&apos;ll be shaped to fit the fan exactly — pinch to zoom and drag to reposition it once
                          it&apos;s added.
                        </span>
                      </span>
                    </button>
                  </div>
                )}

                {hasBackground && (
                  <p className="mb-4 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                    Background added — delete it from the stage above to choose a different type.
                  </p>
                )}
              </>
            )}

            {designMode === "build" && (
              <div className="flex flex-col gap-6">
                {!hasBackground && (
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                        Color
                      </p>
                      <button
                        type="button"
                        onClick={addFill}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                        style={{ border: `1.5px solid ${ACCENT}`, backgroundColor: "#EFE3C4" }}
                      >
                        <span
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                          style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                        />
                        <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
                          Add a solid color or blend
                          <br />
                          <span className="text-[11px]">Pick one color, or add more to blend them.</span>
                        </span>
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                        Photo
                      </p>
                      <button
                        type="button"
                        onClick={() => patternFileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                        style={{ border: `1.5px dashed ${ACCENT}`, backgroundColor: "#EFE3C4" }}
                      >
                        <UploadIcon />
                        <span className="text-xs md:text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
                          Add your own photo
                          <br />
                          <span className="text-[11px]">
                            JPG, PNG up to 8MB — pinch to zoom and drag once it&apos;s added.
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {hasBackground && (
                  <p className="mb-4 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                    Background added — delete it from the stage above to choose a different type.
                  </p>
                )}

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                    Text
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => addText("monogram")}
                      className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${ACCENT}`, color: ACCENT }}
                    >
                      + Monogram / Names
                    </button>
                    <button
                      type="button"
                      onClick={() => addText("message")}
                      className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${ACCENT}`, color: ACCENT }}
                    >
                      + Message
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={patternFileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePatternUpload}
            />
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90 active:brightness-75"
            style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
          >
            Preview my fan
          </button>
          <span className="text-lg font-semibold" style={{ color: "#000000" }}>
            {selectedSize.price} LE
          </span>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 px-6 py-10 overflow-y-auto"
          style={{ backgroundColor: "#FFF4E6" }}
        >
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="absolute top-6 right-6 text-2xl transition-all duration-150 hover:scale-110 active:scale-90 hover:opacity-70"
            style={{ color: "#000000" }}
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex flex-col md:flex-row items-center gap-10">
            {(["front", "back"] as SideId[]).map((id) => (
              <div key={id} className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                  {id === "front" ? "Front" : "Back"}
                </p>
                <div className="relative w-full max-w-[240px] md:max-w-[280px]">
                  <img src={FAN_IMG} alt="" className="w-full h-auto" draggable={false} />
                  {layersBySide[id].slice().sort((a, b) => a.z - b.z).map((layer) => renderLayer(layer, false))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <div className="flex w-full items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                Tassel
              </span>
              <span
                className="h-7 w-7 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: TASSEL_COLORS.find((c) => c.id === selectedTassel)!.hex,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                }}
              />
              <select
                value={selectedTassel}
                onChange={(e) => setSelectedTassel(e.target.value as TasselColorId)}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
              >
                {TASSEL_COLORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
                Quantity
              </span>
              <div className="flex items-center rounded-full px-1 py-1" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${ACCENT}` }}>
                <button
                  type="button"
                  onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold" style={{ color: "#000000" }}>
                  {orderQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={addFanLineToOrder}
              className="w-full rounded-full border-2 px-8 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-all duration-150 hover:-translate-y-0.5"
              style={{ backgroundColor: "transparent", borderColor: ACCENT, color: ACCENT }}
            >
              + Add to Order
            </button>

            {fanOrderLines.length > 0 && (
              <div className="flex w-full flex-col gap-2">
                {fanOrderLines.map((line) => {
                  const tassel = TASSEL_COLORS.find((c) => c.id === line.tasselColor)!;
                  const lineSize = SIZES.find((s) => s.id === line.size)!;

                  return (
                    <div key={line.id} className="rounded-2xl p-3" style={{ backgroundColor: "#EFE3C4" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: tassel.hex, border: "1px solid rgba(0,0,0,0.15)" }} />
                          <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                            {lineSize.label} · {tassel.label} Tassel
                          </span>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateFanLineQuantity(line.id, line.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-bold"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateFanLineQuantity(line.id, line.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-bold"
                          >
                            +
                          </button>
                          <span className="ml-2 min-w-[60px] text-right text-sm font-bold" style={{ color: ACCENT }}>
                            {lineSize.price * line.quantity} LE
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 text-right">
                        <button type="button" onClick={() => removeFanLine(line.id)} className="text-xs underline opacity-50 hover:opacity-100">
                          remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-1 flex items-center justify-between rounded-2xl px-5 py-3" style={{ border: `1px solid ${ACCENT}` }}>
                  <span className="text-sm font-semibold" style={{ color: "#000000" }}>
                    {totalQuantity} fan{totalQuantity !== 1 ? "s" : ""} total
                  </span>
                  <span className="text-lg font-bold" style={{ color: ACCENT }}>
                    {totalOrderPrice} LE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addFanToCart}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-10 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
                  style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
                >
                  Add Order to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold"
        style={{ backgroundColor: ACCENT, color: "#FFF4E6" }}
      >
        {n}
      </span>
      <span className="uppercase tracking-[0.15em] text-[11px] font-medium" style={{ color: "#000000" }}>
        {title}
      </span>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.6">
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <rect x="3" y="16" width="18" height="5" rx="1" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DE4B33" strokeWidth="1.6">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H16a5 5 0 0 0 5-5c0-4-4-7-9-7Z" />
      <circle cx="7.5" cy="10.5" r="1.1" fill="#DE4B33" stroke="none" />
      <circle cx="11" cy="7" r="1.1" fill="#DE4B33" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="#DE4B33" stroke="none" />
    </svg>
  );
}