"use client";
import { useState, useRef, useEffect } from "react";

import {
  Great_Vibes,
  Dancing_Script,
  Sacramento,
  Playfair_Display,
  Bitter,
  Libre_Baskerville,
  Poppins,
  Oswald,
  Archivo_Black,
  Abril_Fatface,
  Bebas_Neue,
  Righteous,
  Pacifico,
  Space_Mono,
  Permanent_Marker,
} from "next/font/google";
import { useLayerGestures } from "../../components/useLayerGestures";
import {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/cart";
import { uploadCustomerImage } from "@/lib/uploadCustomerImage";
import { captureAndUploadDesign, nextPaint, type DesignScene } from "@/lib/captureDesign";
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: ["400"] });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });
const sacramento = Sacramento({ subsets: ["latin"], weight: ["400"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });
const bitter = Bitter({ subsets: ["latin"], weight: ["800"] });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["700"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["700"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["600"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: ["400"] });
const abrilFatface = Abril_Fatface({ subsets: ["latin"], weight: ["400"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const righteous = Righteous({ subsets: ["latin"], weight: ["400"] });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["700"] });
const permanentMarker = Permanent_Marker({ subsets: ["latin"], weight: ["400"] });

const ACCENT = "#DE4B33";

// Shared zoom bounds for the tambourine's uploaded photo. The circular
// frame around it is now permanently pinned to the drum (position AND
// size never change with pinch — see renderLayer), so this only bounds
// the photo itself inside that fixed frame. minScale 1 keeps the photo
// covering the frame with no blank gaps; maxScale is high so the photo
// can be pinched in as far as the person wants.
const PATTERN_SCALE_OPTS = { minScale: 1, maxScale: 8 };

const SIZES = [
  {
    id: "small",
    label: "12 CM",
    cm: 12,
    price: 100,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/custom%20tambourines/small%20tambourine%20custom.png",
    drumPos: { x: 50, y: 54 },
    drumDiameterPct: 85,
  },
  {
    id: "large",
    label: "20 CM",
    cm: 20,
    price: 145,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/custom%20tambourines/large%20tambourine%20custom.png",
    drumPos: { x: 51, y: 49 },
    drumDiameterPct: 82,
  },
] as const;

const MAX_CM = Math.max(...SIZES.map((s) => s.cm));
type SizeId = (typeof SIZES)[number]["id"];

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

const FONTS = [
  { id: "vibes", label: "Great Vibes", className: greatVibes.className, previewSize: 17 },
  { id: "dancing", label: "Dancing Script", className: dancingScript.className, previewSize: 16 },
  { id: "sacramento", label: "Sacramento", className: sacramento.className, previewSize: 17 },
  { id: "playfair", label: "Playfair Display", className: playfair.className, previewSize: 15 },
  { id: "bitter", label: "Bitter Slab", className: bitter.className, previewSize: 15 },
  { id: "baskerville", label: "Libre Baskerville", className: libreBaskerville.className, previewSize: 13 },
  { id: "poppins", label: "Poppins", className: poppins.className, previewSize: 14 },
  { id: "oswald", label: "Oswald", className: oswald.className, previewSize: 15 },
  { id: "archivo", label: "Archivo Black", className: archivoBlack.className, previewSize: 14 },
  { id: "abril", label: "Abril Fatface", className: abrilFatface.className, previewSize: 15 },
  { id: "bebas", label: "Bebas Neue", className: bebasNeue.className, previewSize: 17 },
  { id: "righteous", label: "Righteous", className: righteous.className, previewSize: 14 },
  { id: "pacifico", label: "Pacifico", className: pacifico.className, previewSize: 14 },
  { id: "mono", label: "Space Mono", className: spaceMono.className, previewSize: 12 },
  { id: "marker", label: "Permanent Marker", className: permanentMarker.className, previewSize: 13 },
] as const;

type FontId = (typeof FONTS)[number]["id"];

const FONT_GROUPS: { category: string; ids: FontId[] }[] = [
  { category: "Script", ids: ["vibes", "dancing", "sacramento"] },
  { category: "Serif", ids: ["playfair", "bitter", "baskerville"] },
  { category: "Sans", ids: ["poppins", "oswald", "archivo"] },
  { category: "Display", ids: ["abril", "bebas", "righteous"] },
  { category: "Playful", ids: ["pacifico", "mono", "marker"] },
];

function getFont(id: FontId) {
  return FONTS.find((f) => f.id === id)!;
}

const CATEGORY_COLORS: Record<string, string> = {
  Script: "#B8577A",
  Serif: "#6E86C7",
  Sans: "#8FAA82",
  Display: ACCENT,
  Playful: "#C08A3E",
};

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

// One line per size+ribbon combo the person has built. inCart tracks
// whether this exact line currently exists in the shared cart — it's
// read directly off the cart on every sync, never a separate tracker
// that could fall out of sync with reality.
type TambourineOrderLine = {
  id: string;
  size: SizeId;
  ribbonColor: RibbonColorId;
  quantity: number;
  inCart: boolean;
  renderedDesignUrl?: string;
  layers: Layer[];
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tambourineLineId(size: SizeId, ribbonColor: RibbonColorId) {
  return `custom-tambourine-${size}-${ribbonColor}`;
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
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {FONT_GROUPS.map((group) => (
          <span key={group.category} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[group.category] }}
            />
            <span
              className="text-[8px] font-medium"
              style={{ color: "rgba(0,0,0,0.45)" }}
            >
              {group.category}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {[0, 1, 2].flatMap((row) =>
          FONT_GROUPS.map((group) => {
            const id = group.ids[row];
            const f = getFont(id);
            const isActive = value === f.id;

            return (
              <button
                type="button"
                key={f.id}
                onClick={() => onChange(f.id)}
                className={`${f.className} flex items-center justify-center rounded-lg px-1 py-2 transition-all duration-150 hover:scale-[1.05] active:scale-[0.95]`}
                style={{
                  backgroundColor: isActive ? ACCENT : "#FFFFFF",
                  borderTop: `2.5px solid ${
                    isActive ? ACCENT : CATEGORY_COLORS[group.category]
                  }`,
                  borderLeft: "1px solid rgba(0,0,0,0.1)",
                  borderRight: "1px solid rgba(0,0,0,0.1)",
                  borderBottom: "1px solid rgba(0,0,0,0.1)",
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
          })
        )}
      </div>
    </div>
  );
}

export default function CustomizeTambourinePage() {
  const [size, setSize] = useState<SizeId>("small");
  const [ribbonColor, setRibbonColor] = useState<RibbonColorId>(
    RIBBON_COLORS[0].id
  );

 const [designMode, setDesignMode] = useState<
  "upload" | "build" | null
>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLines, setOrderLines] = useState<TambourineOrderLine[]>([]);
const [uploading, setUploading] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const nextZ = useRef(1);
  const patternFileInputRef = useRef<HTMLInputElement>(null);
  const cartSnapshotRef = useRef<string>("");

  // Third arg: whenever a layer is pressed (drag start / pinch start),
  // it becomes the selected layer again — this is what lets you tap a
  // design you already placed and edit it, instead of it being stuck
  // deselected.
  const gestures = useLayerGestures(layers, setLayers, setSelectedId);

  const selectedSize = SIZES.find((s) => s.id === size)!;

  /*
   * A background means either:
   * - a solid/blended color fill
   * - an uploaded photo/pattern
   *
   * Only one background type is allowed at a time.
   */
  const hasBackground = layers.some(
    (l) => l.type === "fill" || l.type === "pattern"
  );

  /* -------------------------------------------------------------- */
  /* CART <-> ORDER LINE SYNC                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    function syncOrderWithCart() {
      const cart = getCart();

      const cartLines = cart.filter(
        (item) =>
          item.productId === "custom-tambourine" &&
          item.customization?.type === "customized-tambourine"
      );

      const cartById = new Map(
        cartLines.map((item) => [item.id, item])
      );

      try {
        cartSnapshotRef.current = JSON.stringify(cart);
      } catch {
        cartSnapshotRef.current = "";
      }

      // Every line marked inCart is kept in sync with the cart's own
      // quantity, and dropped the moment it's no longer in the cart.
      // Draft lines (not yet added) are left untouched. This reads
      // directly off the cart — no separate tracker to fall out of
      // sync with reality.
      setOrderLines((prev) =>
        prev
          .map((line) => {
            if (!line.inCart) {
              return line;
            }

            const cartItem = cartById.get(line.id);

            if (!cartItem) {
              return null;
            }

            return {
              ...line,
              quantity: cartItem.quantity,
            };
          })
          .filter(
            (line): line is TambourineOrderLine => line !== null
          )
      );
    }

    function handleCartUpdated() {
      syncOrderWithCart();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === "cart") {
        syncOrderWithCart();
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleStorage);

    syncOrderWithCart();

    // Fallback in case an event is ever missed — cheap 150ms poll that
    // only does work when the cart has actually changed.
    const pollInterval = window.setInterval(() => {
      let currentSnapshot = "";

      try {
        currentSnapshot = JSON.stringify(getCart());
      } catch {
        currentSnapshot = "";
      }

      if (currentSnapshot !== cartSnapshotRef.current) {
        syncOrderWithCart();
      }
    }, 150);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(pollInterval);
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* REHYDRATE ORDER LINES FROM CART ON MOUNT                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    const cart = getCart();

    const existingLines: TambourineOrderLine[] = cart
      .filter(
        (item) =>
          item.productId === "custom-tambourine" &&
          item.customization?.type === "customized-tambourine"
      )
      .map((item) => {
        const customization = item.customization;

        if (!customization || customization.type !== "customized-tambourine") {
          return null;
        }

       return {
  id: item.id,
  size: customization.size,
  ribbonColor: customization.ribbonColor as RibbonColorId,
  quantity: item.quantity,
  inCart: true,
  layers: ((customization as any).layers ?? []) as Layer[],   // add this line
};
      })
      .filter((line): line is TambourineOrderLine => line !== null);

    if (existingLines.length === 0) {
      return;
    }

    setOrderLines((prev) => {
      const existingIds = new Set(prev.map((line) => line.id));

      return [
        ...prev,
        ...existingLines.filter((line) => !existingIds.has(line.id)),
      ];
    });
  }, []);

  function addMessage() {
    const id = makeId();

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        role: "message",
        content: "Your message",
        fontSize: 13,
        font: "poppins",
        color: "#000000",
        bgColor: "#FFFFFF",
        bgShape: "rectangle",
        x: selectedSize.drumPos.x,
        y: selectedSize.drumPos.y,
        scale: 1,
        rotation: 0,
        z: nextZ.current++,
      },
    ]);

    setSelectedId(id);
  }

  function addFill() {
    /*
     * Prevent adding a second background if one already exists.
     */
    if (hasBackground) return;

    const id = makeId();

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "fill",
        colors: [ACCENT],
        // x/y/scale are unused for fill now — the frame is always
        // pinned to the drum directly from selectedSize (see
        // renderLayer). Kept only because BaseLayer requires them.
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        z: 0,
      },
    ]);

    setSelectedId(id);
  }

async function handlePatternUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  if (hasBackground) {
    alert("Please delete the existing background before adding a new one.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    alert("Please choose an image under 8MB.");
    return;
  }

  setUploading(true);
  try {
    const url = await uploadCustomerImage(file, "tambourine");
    const id = makeId();

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "pattern",
        src: url,
        tint: null,
        // x/y = the photo's pan position inside the frame (50 = centered),
        // scale = the photo's zoom (1 = covers the drum). The frame itself
        // is always pinned to the drum — see renderLayer.
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        z: 0,
      },
    ]);

    setSelectedId(id);
  } catch {
    alert("Couldn't upload your image. Please check your connection and try again.");
  } finally {
    setUploading(false);
  }
}

  function updateLayer(id: string, patch: Partial<Layer>) {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? ({ ...l, ...patch } as Layer) : l
      )
    );
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  function addFillColor(id: string) {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id && l.type === "fill"
          ? {
              ...l,
              colors: [...l.colors, "#FFFFFF"],
            }
          : l
      )
    );
  }

  function updateFillColor(
    id: string,
    index: number,
    color: string
  ) {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.type !== "fill") return l;

        const colors = [...l.colors];
        colors[index] = color;

        return {
          ...l,
          colors,
        };
      })
    );
  }

  function removeFillColor(id: string, index: number) {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.type !== "fill") return l;

        if (l.colors.length <= 1) return l;

        return {
          ...l,
          colors: l.colors.filter((_, i) => i !== index),
        };
      })
    );
  }

  const selectedLayer =
    layers.find((l) => l.id === selectedId) ?? null;

  /* -------------------------------------------------------------- */
  /* ORDER LINE ACTIONS                                              */
  /* -------------------------------------------------------------- */

 async function addTambourineLineToOrder() {
  const hasAnyContent = layers.length > 0;
  const baseId = tambourineLineId(size, ribbonColor);

  // A designed tambourine always gets its own line, so two different
  // designs with the same size and ribbon never merge into one.
  const lineId = hasAnyContent ? `${baseId}-d${Date.now().toString(36)}` : baseId;
  const designSnapshot = structuredClone(layers);

  let renderedDesignUrl: string | undefined;

  if (hasAnyContent && stageRef.current) {
  setUploading(true);
  setSelectedId(null);
  await nextPaint();

  // Wide enough that the drum prints at about 300 DPI at its real size.
  const targetWidth = Math.round(
    ((selectedSize.cm / 2.54) * 300) / (selectedSize.drumDiameterPct / 100)
  );

  // ↓ the new block goes here, replacing the old capture line
  const scene: DesignScene = {
    baseImageUrl: selectedSize.img,
    layers,
    shape: {
      kind: "circle",
      xPct: selectedSize.drumPos.x,
      yPct: selectedSize.drumPos.y,
      diameterPct: selectedSize.drumDiameterPct,
    },
  };

  const url = await captureAndUploadDesign(stageRef.current, "tambourine", targetWidth, scene);
  setUploading(false);
  if (url) renderedDesignUrl = url;
}

  setOrderLines((prev) => {
    const existingIndex = prev.findIndex((line) => line.id === lineId);

    if (existingIndex !== -1) {
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + orderQuantity,
      };
      return updated;
    }

    return [
      ...prev,
      {
        id: lineId,
        size,
        ribbonColor,
        quantity: orderQuantity,
        inCart: false,
        layers: designSnapshot,
        renderedDesignUrl,
      },
    ];
  });

  setOrderQuantity(1);
}

  function updateTambourineLineQuantity(
    lineId: string,
    newQuantity: number
  ) {
    if (newQuantity <= 0) {
      removeTambourineLine(lineId);
      return;
    }

    const safeQuantity = Math.max(1, newQuantity);
    const existingLine = orderLines.find((l) => l.id === lineId);

    setOrderLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: safeQuantity } : line
      )
    );

    if (existingLine?.inCart) {
      updateCartItemQuantity(lineId, safeQuantity);
    }
  }

  function removeTambourineLine(lineId: string) {
    setOrderLines((prev) => prev.filter((line) => line.id !== lineId));
    removeCartItem(lineId);
  }

  function addTambourineOrderToCart() {
    if (!orderLines.length) return;

    const currentCart = getCart();

    orderLines.forEach((line) => {
      const lineSize = SIZES.find((s) => s.id === line.size)!;

      const existing = currentCart.find((item) => item.id === line.id);

      if (existing) {
        updateCartItemQuantity(line.id, line.quantity);
        return;
      }

     addToCart({
  id: line.id,
  productId: "custom-tambourine",
  productName: "Tambourine",
  price: lineSize.price,
  quantity: line.quantity,
  scent: null,
  color: `${lineSize.label} · ${RIBBON_COLORS.find((c) => c.id === line.ribbonColor)!.label} Ribbon`,
  image: lineSize.img,
  productRefId: 31,
  customization: {
    type: "customized-tambourine",
    size: line.size,
    sizeCm: lineSize.cm,
    ribbonColor: line.ribbonColor,
    layers: line.layers,
    renderedDesignUrl: line.renderedDesignUrl,
  },
});
  });
    setOrderLines((prev) =>
      prev.map((line) => ({
        ...line,
        inCart: true,
      }))
    );

     cartSnapshotRef.current = JSON.stringify(getCart());

    window.dispatchEvent(new Event("openCart"));
  }

  const totalQuantity = orderLines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  const totalOrderPrice = orderLines.reduce(
    (sum, line) =>
      sum + SIZES.find((s) => s.id === line.size)!.price * line.quantity,
    0
  );

  function bgShapeStyle(
    shape: TextLayer["bgShape"],
    hasContent: boolean
  ): React.CSSProperties {
    if (!hasContent) return {};

    switch (shape) {
      case "circle":
        return {
          borderRadius: "50%",
          aspectRatio: "1 / 1",
          padding: "18px 14px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        };

      case "pill":
        return {
          borderRadius: 999,
          padding: "6px 16px",
        };

      case "ribbon":
        return {
          padding: "6px 22px",
          clipPath:
            "polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)",
        };

      case "diamond":
        return {
          aspectRatio: "1 / 1",
          padding: "22px 20px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath:
            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        };

      case "hexagon":
        return {
          padding: "14px 22px",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        };

      case "arch":
        return {
          padding: "10px 18px 6px",
          borderRadius: "999px 999px 6px 6px",
        };

      case "heart":
        return {
          aspectRatio: "1 / 1",
          padding: "10px 16px 12px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath:
            "polygon(50.0% 23.9%, 50.2% 22.2%, 51.5% 17.5%, 54.7% 11.3%, 60.2% 5.2%, 67.7% 1.0%, 76.5% 0.0%, 85.4% 2.7%, 93.0% 8.7%, 98.2% 17.3%, 100.0% 27.3%, 98.2% 37.7%, 93.0% 47.7%, 85.4% 57.2%, 76.5% 66.0%, 67.7% 74.4%, 60.2% 82.3%, 54.7% 89.3%, 51.5% 95.0%, 50.2% 98.7%, 50.0% 100.0%, 49.8% 98.7%, 48.5% 95.0%, 45.3% 89.3%, 39.8% 82.3%, 32.3% 74.4%, 23.5% 66.0%, 14.6% 57.2%, 7.0% 47.7%, 1.8% 37.7%, 0.0% 27.3%, 1.8% 17.3%, 7.0% 8.7%, 14.6% 2.7%, 23.5% 0.0%, 32.3% 1.0%, 39.8% 5.2%, 45.3% 11.3%, 48.5% 17.5%, 49.8% 22.2%)",
        };

      case "octagon":
        return {
          padding: "12px 16px",
          clipPath:
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
        };

      case "cloud":
        return {
          padding: "16px 20px",
          borderRadius:
            "40% 60% 55% 45% / 55% 45% 55% 45%",
        };

      case "rectangle":
      default:
        return {
          borderRadius: 8,
          padding: "4px 10px",
        };
    }
  }

  function renderLayer(
    layer: Layer,
    interactive: boolean
  ) {
    const isSelected =
      interactive && layer.id === selectedId;

    /* ---------------------------------------------------------- */
    /* Background layers (fill / pattern)                          */
    /* ---------------------------------------------------------- */
    /*
     * The frame below is ALWAYS pinned to the drum's own position and
     * size, taken directly from selectedSize — never from layer.x/y
     * or layer.scale. This is what makes it physically impossible to
     * drag or pinch the design off the drum or past its edge.
     *
     * For a pattern layer, layer.x/y/scale instead describe the PAN
     * and ZOOM of the photo *inside* this fixed frame — so the person
     * can pinch to zoom the photo in as far as they like, and pan it
     * around, entirely independent of the frame itself.
     */
    if (layer.type === "fill" || layer.type === "pattern") {
      const frameStyle: React.CSSProperties = {
        position: "absolute",
        left: `${selectedSize.drumPos.x}%`,
        top: `${selectedSize.drumPos.y}%`,
        width: `${selectedSize.drumDiameterPct}%`,
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        overflow: "hidden",
        transform: "translate(-50%, -50%)",
        outline: isSelected ? `1.5px dashed ${ACCENT}` : "none",
        outlineOffset: "4px",
        touchAction: interactive ? "none" : undefined,
      };

      if (layer.type === "fill") {
        const background =
          layer.colors.length === 1
            ? layer.colors[0]
            : `linear-gradient(135deg, ${layer.colors.join(", ")})`;

        return (
          <div
            key={layer.id}
            onClick={
              interactive
                ? () => setSelectedId(layer.id)
                : undefined
            }
            style={{
              ...frameStyle,
              background,
              cursor: interactive ? "pointer" : "default",
            }}
          />
        );
      }

      // Pattern layer — photo pans/zooms independently inside the
      // fixed frame, same technique as the fan's pattern layer.
      const zoom = layer.scale;
      const maxPanPct = (zoom - 1) * 50;
      const offsetX = ((layer.x - 50) / 50) * maxPanPct;
      const offsetY = ((layer.y - 50) / 50) * maxPanPct;

      return (
        <div
          key={layer.id}
          onPointerDown={
            interactive
              ? gestures.onPointerDown(
                  layer.id,
                  stageRef.current,
                  PATTERN_SCALE_OPTS
                )
              : undefined
          }
          onPointerMove={
            interactive
              ? gestures.onPointerMove(stageRef.current)
              : undefined
          }
          onPointerUp={
            interactive ? gestures.onPointerUp : undefined
          }
          onWheel={
            interactive
              ? gestures.onWheelZoom(layer.id, PATTERN_SCALE_OPTS)
              : undefined
          }
          style={{
            ...frameStyle,
            cursor: interactive ? "grab" : "default",
          }}
        >
          <img
            src={layer.src}
            alt="Your uploaded pattern"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />

          {layer.tint && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: layer.tint,
                mixBlendMode: "color",
                opacity: 0.85,
              }}
            />
          )}
        </div>
      );
    }
    /* ---------------------------------------------------------- */
    /* Text layer — freely draggable/pinchable, unchanged           */
    /* ---------------------------------------------------------- */

    const commonStyle: React.CSSProperties = {
      position: "absolute",
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      transform: `translate(-50%, -50%) scale(${layer.scale})`,
      cursor: interactive ? "grab" : "default",
      outline: isSelected
        ? `1.5px dashed ${ACCENT}`
        : "none",
      outlineOffset: "4px",
      touchAction: interactive ? "none" : undefined,
    };

        const hasBg = !!layer.bgColor;
    const fontDef = getFont(layer.font);

    return (
      <div
        key={layer.id}
        data-text-layer="true"        // ← add this line
        onPointerDown={
          interactive
            ? gestures.onPointerDown(layer.id, stageRef.current)
            : undefined
        }
        onPointerMove={
          interactive
            ? gestures.onPointerMove(stageRef.current)
            : undefined
        }
        onPointerUp={
          interactive
            ? gestures.onPointerUp
            : undefined
        }
        onWheel={
          interactive
            ? gestures.onWheelZoom(layer.id)
            : undefined
        }
        className={fontDef.className}
        style={{
         
          ...commonStyle,
          fontSize: layer.fontSize,
          fontWeight: 500,
          color: layer.color,
          whiteSpace: "nowrap",
          backgroundColor:
            layer.bgColor ?? "transparent",
          boxShadow: hasBg
            ? "0 1px 4px rgba(0,0,0,0.15)"
            : "none",
          textShadow: hasBg
            ? "none"
            : "0 1px 2px rgba(255,255,255,0.6)",
          ...bgShapeStyle(
            layer.bgShape,
            hasBg
          ),
        }}
      >
        {layer.content}
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "#FFF4E6" }}
      className="w-full min-h-screen"
    >
      <div className="flex flex-col items-center px-6 py-8">
        <div className="relative flex w-full max-w-[220px] md:max-w-[320px] items-center justify-center">
          <div
            ref={stageRef}
            className="relative touch-none select-none"
            style={{
              width: `${(selectedSize.cm / MAX_CM) * 100}%`,
            }}
            onClick={(e) => {
              if (e.target === stageRef.current) {
                setSelectedId(null);
              }
            }}
          >
            <img
              src={selectedSize.img}
              alt="Your customized tambourine"
              className="w-full h-auto pointer-events-none"
              draggable={false}
            />

            {layers
              .slice()
              .sort((a, b) => a.z - b.z)
              .map((layer) =>
                renderLayer(layer, true)
              )}
          </div>
        </div>

        {selectedLayer && (
          <div
            className="mt-4 flex w-full max-w-[320px] flex-col gap-3 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "#EFE3C4",
            }}
          >
            {selectedLayer.type === "text" && (
              <>
                <input
                  value={selectedLayer.content}
                  onChange={(e) =>
                    updateLayer(
                      selectedLayer.id,
                      {
                        content: e.target.value,
                      }
                    )
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: `1px solid ${ACCENT}`,
                    backgroundColor: "#FFFFFF",
                    color: "#000000",
                  }}
                  placeholder="Your message"
                />

                <div>
                  <span
                    className="mb-1.5 block text-[11px] font-medium"
                    style={{
                      color: "rgba(0,0,0,0.55)",
                    }}
                  >
                    Font
                  </span>

                  <FontPicker
                    value={selectedLayer.font}
                    previewText={selectedLayer.content}
                    onChange={(f) =>
                      updateLayer(
                        selectedLayer.id,
                        { font: f }
                      )
                    }
                  />
                </div>
              </>
            )}

            {/*
              Tint control for pattern layers has been removed — the
              only actions on an uploaded pattern now are Undo
              (below, which removes the layer entirely once there's
              nothing left to undo) and delete.
            */}

            {selectedLayer.type === "fill" && (
              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px]"
                  style={{
                    color: "rgba(0,0,0,0.55)",
                  }}
                >
                  {selectedLayer.colors.length === 1
                    ? "Color"
                    : "Colors (blended)"}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedLayer.colors.map((c, i) => (
                    <div
                      key={i}
                      className="relative"
                    >
                      <ColorWheelPicker
                        value={c}
                        onChange={(newC) =>
                          updateFillColor(
                            selectedLayer.id,
                            i,
                            newC
                          )
                        }
                      />

                      {selectedLayer.colors.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeFillColor(
                              selectedLayer.id,
                              i
                            )
                          }
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                          style={{
                            backgroundColor:
                              "#000000",
                            color: "#FFFFFF",
                          }}
                          title="Remove this color"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      addFillColor(
                        selectedLayer.id
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-transform hover:scale-110"
                    style={{
                      borderColor: ACCENT,
                      color: ACCENT,
                    }}
                    title="Add another color"
                  >
                    +
                  </button>
                </div>

                <span
                  className="text-[10px]"
                  style={{
                    color: "rgba(0,0,0,0.45)",
                  }}
                >
                  Add more than one color to blend
                  them together.
                </span>
              </div>
            )}

            {selectedLayer.type === "text" && (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="w-14 text-[11px]"
                    style={{
                      color: "rgba(0,0,0,0.55)",
                    }}
                  >
                    Color
                  </span>

                  <ColorWheelPicker
                    value={selectedLayer.color}
                    onChange={(c) =>
                      updateLayer(
                        selectedLayer.id,
                        { color: c }
                      )
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-14 text-[11px]"
                    style={{
                      color: "rgba(0,0,0,0.55)",
                    }}
                  >
                    Backing
                  </span>

                  <div className="flex flex-1 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateLayer(
                          selectedLayer.id,
                          { bgColor: null }
                        )
                      }
                      className="h-6 w-6 flex-shrink-0 rounded-full border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: "#FFFFFF",
                        backgroundImage:
                          "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                        borderColor:
                          selectedLayer.bgColor === null
                            ? "#000000"
                            : "rgba(0,0,0,0.3)",
                        borderWidth:
                          selectedLayer.bgColor === null
                            ? 2
                            : 1,
                      }}
                      title="No backing"
                    />

                    <ColorWheelPicker
                      value={
                        selectedLayer.bgColor ??
                        "#FFFFFF"
                      }
                      onChange={(c) =>
                        updateLayer(
                          selectedLayer.id,
                          { bgColor: c }
                        )
                      }
                    />

                    <span
                      className="text-[10px]"
                      style={{
                        color:
                          "rgba(0,0,0,0.45)",
                      }}
                    >
                      any backing color
                    </span>
                  </div>
                </div>

                {selectedLayer.bgColor && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-14 text-[11px]"
                      style={{
                        color:
                          "rgba(0,0,0,0.55)",
                      }}
                    >
                      Shape
                    </span>

                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {BG_SHAPES.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() =>
                            updateLayer(
                              selectedLayer.id,
                              {
                                bgShape: s.id,
                              }
                            )
                          }
                          className="rounded-md px-2.5 py-1 text-[11px] transition-all"
                          style={{
                            backgroundColor:
                              selectedLayer.bgShape ===
                              s.id
                                ? ACCENT
                                : "#FFFFFF",
                            color:
                              selectedLayer.bgShape ===
                              s.id
                                ? "#FFF4E6"
                                : "rgba(0,0,0,0.6)",
                            border: `1px solid ${
                              selectedLayer.bgShape ===
                              s.id
                                ? ACCENT
                                : "rgba(0,0,0,0.15)"
                            }`,
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

            {selectedLayer.type === "pattern" ? (
              // Patterns only get Delete — no Undo button here.
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() =>
                    removeLayer(selectedLayer.id)
                  }
                  className="text-[11px] font-medium underline"
                  style={{
                    color: "rgba(0,0,0,0.5)",
                  }}
                >
                  delete
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (gestures.canUndo()) {
                      gestures.undo();
                    } else {
                      removeLayer(selectedLayer.id);
                    }
                  }}
                  className="text-xs font-medium underline"
                  style={{ color: ACCENT }}
                >
                  ↺ Undo
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeLayer(selectedLayer.id)
                  }
                  className="text-[11px] font-medium underline"
                  style={{
                    color: "rgba(0,0,0,0.5)",
                  }}
                >
                  delete
                </button>
              </div>
            )}
          </div>
        )}

        <p
          className="text-center text-[11px] mt-3 max-w-xs"
          style={{
            color: "rgba(0,0,0,0.45)",
          }}
        >
          Tap an item below to add it, then use one finger to move it and
          two fingers to pinch-zoom it into place.
        </p>
      </div>

      <div className="px-6 md:px-12 py-4 md:py-8 max-w-2xl mx-auto">
        <p
          className="uppercase tracking-[0.25em] text-xs md:text-sm mb-3"
          style={{ color: ACCENT }}
        >
          made by you, for you
        </p>

        <h1 className="font-serif leading-[1.05] mb-4">
          <span
            className="block text-3xl md:text-5xl font-bold"
            style={{ color: "#000000" }}
          >
            Customize
          </span>

          <span
            className="block text-3xl md:text-5xl font-bold"
            style={{ color: ACCENT }}
          >
            your tambourine
          </span>
        </h1>

                <p
          className="text-sm md:text-base mb-10"
          style={{ color: "rgba(0,0,0,0.62)" }}
        >
          Make your celebrations stand out with our unique wooden tambourines.
          Each piece features a fully customized sticker with your chosen
          design and a ribbon in your preferred color, making it a wonderful,
          interactive keepsake for weddings and major milestones.
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
                border: `1.5px solid ${
                  size === s.id
                    ? ACCENT
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
                className="object-contain"
                style={{
                  width: `${
                    24 + (s.cm / MAX_CM) * 16
                  }px`,
                  height: `${
                    24 + (s.cm / MAX_CM) * 16
                  }px`,
                }}
              />

              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: "#000000" }}
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

        {/*
          Ribbon color selection has moved to the preview step (see
          below), matching the Fan customizer's Tassel flow — this
          lets the person stack multiple ribbon colors and quantities
          on the same design without leaving preview.
        */}

        <StepLabel
          n={2}
          title="Design the drum face (optional)"
        />

        {designMode === null ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() =>
                setDesignMode("upload")
              }
              className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
              style={{
                border: `1.5px dashed ${ACCENT}`,
                backgroundColor: "#EFE3C4",
              }}
            >
              <PhotoUploadIcon />

              <span
                className="text-xs font-semibold"
                style={{ color: "#000000" }}
              >
                Upload your own design
              </span>

              <span
                className="text-[11px]"
                style={{
                  color: "rgba(0,0,0,0.55)",
                }}
              >
                One finished image, shaped to
                the drum
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setDesignMode("build")
              }
              className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
              style={{
                border: `1.5px dashed ${ACCENT}`,
                backgroundColor: "#EFE3C4",
              }}
            >
              <PaletteIcon />

              <span
                className="text-xs font-semibold"
                style={{ color: "#000000" }}
              >
                Design it here
              </span>

              <span
                className="text-[11px]"
                style={{
                  color: "rgba(0,0,0,0.55)",
                }}
              >
                Color, photo, and message
              </span>
            </button>
          </div>
        ) : (
          <div className="mb-8">
            {/*
              Once a mode is picked, don't offer it as a choice again —
              only offer a direct switch to the OTHER mode. Pressing
              "Design it here" and then wanting to change your mind
              should only ever show "upload a different design",
              never both original cards again.
            */}
            <button
              type="button"
              onClick={() =>
                setDesignMode(
                  designMode === "upload" ? "build" : "upload"
                )
              }
              className="mb-3 text-[11px] font-medium underline"
              style={{ color: ACCENT }}
            >
              {designMode === "upload"
                ? "→ design it here instead"
                : "→ upload a different design instead"}
            </button>

            {designMode === "upload" && (
              <>
                {!hasBackground && (
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        patternFileInputRef.current?.click()
                      }
                      className="flex-1 flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                      style={{
                        border: `1.5px dashed ${ACCENT}`,
                        backgroundColor: "#EFE3C4",
                      }}
                    >
                      <PhotoUploadIcon />

                      <span
                        className="text-xs md:text-sm"
                        style={{
                          color:
                            "rgba(0,0,0,0.62)",
                        }}
                      >
                        Upload your own finished
                        design
                        <br />
                        <span className="text-[11px]">
                          It&apos;ll be shaped to fit
                          the drum exactly — pinch to
                          zoom and drag to reposition
                          it once it&apos;s added.
                        </span>
                      </span>
                    </button>
                  </div>
                )}

                {hasBackground && (
                  <p
                    className="mb-4 text-xs"
                    style={{
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    Background added — delete it
                    from the stage above to choose a
                    different type.
                  </p>
                )}
{uploading && (
  <p className="mb-3 text-xs" style={{ color: ACCENT }}>
    Uploading your image…
  </p>
)}
                <input
                  ref={patternFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePatternUpload}
                />
              </>
            )}

            {designMode === "build" && (
              <div className="flex flex-col gap-6">
                {!hasBackground && (
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p
                        className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
                        style={{ color: ACCENT }}
                      >
                        Color
                      </p>

                      <button
                        type="button"
                        onClick={addFill}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                        style={{
                          border: `1.5px solid ${ACCENT}`,
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <span
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                          style={{
                            background:
                              "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                          }}
                        />

                        <span
                          className="text-xs md:text-sm"
                          style={{
                            color:
                              "rgba(0,0,0,0.62)",
                          }}
                        >
                          Add a solid color or
                          blend
                          <br />
                          <span className="text-[11px]">
                            Pick one color, or add
                            more to blend them.
                          </span>
                        </span>
                      </button>
                    </div>

                    <div className="flex-1">
                      <p
                        className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
                        style={{ color: ACCENT }}
                      >
                        Photo
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          patternFileInputRef.current?.click()
                        }
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                        style={{
                          border: `1.5px dashed ${ACCENT}`,
                          backgroundColor:
                            "#EFE3C4",
                        }}
                      >
                        <PhotoUploadIcon />

                        <span
                          className="text-xs md:text-sm"
                          style={{
                            color:
                              "rgba(0,0,0,0.62)",
                          }}
                        >
                          Add your own photo
                          <br />
                          <span className="text-[11px]">
                            JPG, PNG up to 8MB —
                            pinch to zoom and drag
                            once it&apos;s added.
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {hasBackground && (
                  <p
                    className="mb-4 text-xs"
                    style={{
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    Background added — delete it
                    from the stage above to choose a
                    different type.
                  </p>
                )}

                <input
                  ref={patternFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePatternUpload}
                />

                <div>
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
                    style={{ color: ACCENT }}
                  >
                    Message
                  </p>

                  <button
                    type="button"
                    onClick={addMessage}
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${ACCENT}`,
                      color: ACCENT,
                    }}
                  >
                    + Add a message
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90 active:brightness-75"
            style={{
              backgroundColor: ACCENT,
              color: "#FFF4E6",
            }}
          >
            Preview my tambourine
          </button>

          <span
            className="text-lg font-semibold"
            style={{ color: "#000000" }}
          >
            {selectedSize.price} LE
          </span>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 px-6 py-10 overflow-y-auto"
          style={{
            backgroundColor: "#FFF4E6",
          }}
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

  <div className="relative flex w-full max-w-[220px] md:max-w-[320px] items-center justify-center">
            <div
              className="relative"
              style={{
                width: `${
                  (selectedSize.cm / MAX_CM) *
                  100
                }%`,
              }}
            >
              <img
                src={selectedSize.img}
                alt="Your customized tambourine"
                className="w-full h-auto"
                draggable={false}
              />

              {layers
                .slice()
                .sort((a, b) => a.z - b.z)
                .map((layer) =>
                  renderLayer(layer, false)
                )}
            </div>
          </div>

          <div className="flex w-full max-w-sm flex-col items-center gap-4">

            {/* RIBBON COLOR — moved here from the main customize page,
                same stackable-order pattern as the Fan's Tassel picker */}
            <div className="flex w-full items-center gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: ACCENT }}
              >
                Ribbon
              </span>

              <span
                className="h-7 w-7 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: RIBBON_COLORS.find(
                    (c) => c.id === ribbonColor
                  )!.hex,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  boxShadow:
                    ribbonColor === "gold"
                      ? "inset 0 0 6px rgba(255,255,255,0.6)"
                      : undefined,
                }}
              />

              <select
                value={ribbonColor}
                onChange={(e) =>
                  setRibbonColor(e.target.value as RibbonColorId)
                }
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
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

            <div className="flex items-center gap-4">
              <span
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: ACCENT }}
              >
                Quantity
              </span>

              <div
                className="flex items-center rounded-full px-1 py-1"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${ACCENT}`,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOrderQuantity((q) => Math.max(1, q - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: "#EFE3C4",
                    color: "#000000",
                  }}
                >
                  −
                </button>

                <span
                  className="w-10 text-center text-sm font-semibold"
                  style={{ color: "#000000" }}
                >
                  {orderQuantity}
                </span>

                <button
                  type="button"
                  onClick={() => setOrderQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: "#EFE3C4",
                    color: "#000000",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={addTambourineLineToOrder}
              className="w-full rounded-full border-2 px-8 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-all duration-150 hover:-translate-y-0.5"
              style={{
                backgroundColor: "transparent",
                borderColor: ACCENT,
                color: ACCENT,
              }}
            >
              + Add to Order
            </button>

            {orderLines.length > 0 && (
              <div className="flex w-full flex-col gap-2">
                {orderLines.map((line) => {
                  const lineSize = SIZES.find((s) => s.id === line.size)!;
                  const ribbon = RIBBON_COLORS.find(
                    (c) => c.id === line.ribbonColor
                  )!;

                  return (
                    <div
                      key={line.id}
                      className="rounded-2xl p-3"
                      style={{ backgroundColor: "#EFE3C4" }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{
                              backgroundColor: ribbon.hex,
                              border: "1px solid rgba(0,0,0,0.15)",
                            }}
                          />

                          <span
                            className="text-sm font-semibold"
                            style={{ color: "#000000" }}
                          >
                            {lineSize.label} · {ribbon.label} Ribbon
                          </span>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateTambourineLineQuantity(
                                line.id,
                                line.quantity - 1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-bold"
                          >
                            −
                          </button>

                          <span className="w-5 text-center text-sm font-semibold">
                            {line.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateTambourineLineQuantity(
                                line.id,
                                line.quantity + 1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-bold"
                          >
                            +
                          </button>

                          <span
                            className="ml-2 min-w-[60px] text-right text-sm font-bold"
                            style={{ color: ACCENT }}
                          >
                            {lineSize.price * line.quantity} LE
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
                  );
                })}

                <div
                  className="mt-1 flex items-center justify-between rounded-2xl px-5 py-3"
                  style={{ border: `1px solid ${ACCENT}` }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#000000" }}
                  >
                    {totalQuantity} tambourine{totalQuantity !== 1 ? "s" : ""} total
                  </span>

                  <span
                    className="text-lg font-bold"
                    style={{ color: ACCENT }}
                  >
                    {totalOrderPrice} LE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addTambourineOrderToCart}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-10 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
                  style={{
                    backgroundColor: ACCENT,
                    color: "#FFF4E6",
                  }}
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

function StepLabel({
  n,
  title,
}: {
  n: number;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold"
        style={{
          backgroundColor: ACCENT,
          color: "#FFF4E6",
        }}
      >
        {n}
      </span>

      <span
        className="uppercase tracking-[0.15em] text-[11px] font-medium"
        style={{ color: "#000000" }}
      >
        {title}
      </span>
    </div>
  );
}

function PhotoUploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#DE4B33"
      strokeWidth="1.6"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <circle
        cx="9"
        cy="10"
        r="1.6"
        fill="#DE4B33"
        stroke="none"
      />
      <path d="M21 16l-5.5-5.5L9 17" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#DE4B33"
      strokeWidth="1.6"
    >
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H16a5 5 0 0 0 5-5c0-4-4-7-9-7Z" />
      <circle
        cx="7.5"
        cy="10.5"
        r="1.1"
        fill="#DE4B33"
        stroke="none"
      />
      <circle
        cx="11"
        cy="7"
        r="1.1"
        fill="#DE4B33"
        stroke="none"
      />
      <circle
        cx="15.5"
        cy="8.5"
        r="1.1"
        fill="#DE4B33"
        stroke="none"
      />
    </svg>
  );
}