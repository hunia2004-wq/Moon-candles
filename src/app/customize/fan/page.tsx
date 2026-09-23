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

const greatVibes = Great_Vibes({ subsets: ["latin"], weight: ["400"] });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });
const sacramento = Sacramento({ subsets: ["latin"], weight: ["400"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });
const bitter = Bitter({ subsets: ["latin"], weight: ["800"] });
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["700"],
});
const poppins = Poppins({ subsets: ["latin"], weight: ["700"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["600"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: ["400"] });
const abrilFatface = Abril_Fatface({ subsets: ["latin"], weight: ["400"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const righteous = Righteous({ subsets: ["latin"], weight: ["400"] });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["700"] });
const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
});

const ACCENT = "#DE4B33";
const PRICE = 25;

const FAN_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customized%20fan/custom%20fan.png";

const PATTERN_SCALE_OPTS = {
  minScale: 1,
  maxScale: 6,
};

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

type FanOrderLine = {
  id: string;
  tasselColor: TasselColorId;
  quantity: number;
  inCart: boolean;
};

/* ------------------------------------------------------------------ */
/* Fonts                                                              */
/* ------------------------------------------------------------------ */

const FONTS = [
  {
    id: "vibes",
    label: "Great Vibes",
    short: "Vibes",
    className: greatVibes.className,
    previewSize: 17,
  },
  {
    id: "dancing",
    label: "Dancing Script",
    short: "Dancing",
    className: dancingScript.className,
    previewSize: 16,
  },
  {
    id: "sacramento",
    label: "Sacramento",
    short: "Sacramento",
    className: sacramento.className,
    previewSize: 17,
  },
  {
    id: "playfair",
    label: "Playfair Display",
    short: "Playfair",
    className: playfair.className,
    previewSize: 15,
  },
  {
    id: "bitter",
    label: "Bitter Slab",
    short: "Slab",
    className: bitter.className,
    previewSize: 15,
  },
  {
    id: "baskerville",
    label: "Libre Baskerville",
    short: "Baskerville",
    className: libreBaskerville.className,
    previewSize: 13,
  },
  {
    id: "poppins",
    label: "Poppins",
    short: "Poppins",
    className: poppins.className,
    previewSize: 14,
  },
  {
    id: "oswald",
    label: "Oswald",
    short: "Oswald",
    className: oswald.className,
    previewSize: 15,
  },
  {
    id: "archivo",
    label: "Archivo Black",
    short: "Archivo",
    className: archivoBlack.className,
    previewSize: 14,
  },
  {
    id: "abril",
    label: "Abril Fatface",
    short: "Abril",
    className: abrilFatface.className,
    previewSize: 15,
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    short: "Bebas",
    className: bebasNeue.className,
    previewSize: 17,
  },
  {
    id: "righteous",
    label: "Righteous",
    short: "Righteous",
    className: righteous.className,
    previewSize: 14,
  },
  {
    id: "pacifico",
    label: "Pacifico",
    short: "Pacifico",
    className: pacifico.className,
    previewSize: 14,
  },
  {
    id: "mono",
    label: "Space Mono",
    short: "Mono",
    className: spaceMono.className,
    previewSize: 12,
  },
  {
    id: "marker",
    label: "Permanent Marker",
    short: "Marker",
    className: permanentMarker.className,
    previewSize: 13,
  },
] as const;

type FontId = (typeof FONTS)[number]["id"];

const FONT_GROUPS: {
  category: string;
  ids: FontId[];
}[] = [
  {
    category: "Script",
    ids: ["vibes", "dancing", "sacramento"],
  },
  {
    category: "Serif",
    ids: ["playfair", "bitter", "baskerville"],
  },
  {
    category: "Sans",
    ids: ["poppins", "oswald", "archivo"],
  },
  {
    category: "Display",
    ids: ["abril", "bebas", "righteous"],
  },
  {
    category: "Playful",
    ids: ["pacifico", "mono", "marker"],
  },
];

function getFont(id: FontId) {
  return FONTS.find((f) => f.id === id)!;
}

/* ------------------------------------------------------------------ */
/* Layer model                                                        */
/* ------------------------------------------------------------------ */

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

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultLayersForSide(): Layer[] {
  return [];
}

/* ------------------------------------------------------------------ */
/* Color picker                                                       */
/* ------------------------------------------------------------------ */

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
        background:
          "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
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

/* ------------------------------------------------------------------ */
/* Font picker                                                        */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
  Script: "#B8577A",
  Serif: "#6E86C7",
  Sans: "#8FAA82",
  Display: ACCENT,
  Playful: "#C08A3E",
};

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
          <span
            key={group.category}
            className="flex items-center gap-1"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  CATEGORY_COLORS[group.category],
              }}
            />

            <span
              className="text-[8px] font-medium"
              style={{
                color: "rgba(0,0,0,0.45)",
              }}
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
                key={f.id}
                onClick={() => onChange(f.id)}
                className={`${f.className} flex items-center justify-center rounded-lg px-1 py-2 transition-all duration-150 hover:scale-[1.05] active:scale-[0.95]`}
                style={{
                  backgroundColor: isActive
                    ? ACCENT
                    : "#FFFFFF",
                  borderTop: `2.5px solid ${
                    isActive
                      ? ACCENT
                      : CATEGORY_COLORS[group.category]
                  }`,
                  borderLeft:
                    "1px solid rgba(0,0,0,0.1)",
                  borderRight:
                    "1px solid rgba(0,0,0,0.1)",
                  borderBottom:
                    "1px solid rgba(0,0,0,0.1)",
                }}
                title={f.label}
              >
                <span
                  className="leading-none"
                  style={{
                    fontSize: Math.min(
                      f.previewSize,
                      14
                    ),
                    color: isActive
                      ? "#FFF4E6"
                      : "#000000",
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

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CustomizeFanPage() {
  const [activeSide, setActiveSide] =
    useState<SideId>("front");

  const [layersBySide, setLayersBySide] =
    useState<LayersBySide>({
      front: defaultLayersForSide(),
      back: defaultLayersForSide(),
    });

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [showPreview, setShowPreview] =
    useState(false);

  const [quantity, setQuantity] = useState(1);

  const [addedToCart, setAddedToCart] =
    useState(false);

  const [selectedTassel, setSelectedTassel] =
    useState<TasselColorId>(
      TASSEL_COLORS[0].id
    );

  const [fanOrderLines, setFanOrderLines] =
    useState<FanOrderLine[]>([]);

  const stageRef =
    useRef<HTMLDivElement>(null);

  const nextZ = useRef(1);

  const patternFileInputRef =
    useRef<HTMLInputElement>(null);

  const cartSnapshotRef =
    useRef<string>("");

  const layers =
    layersBySide[activeSide];

  function setLayers(
    updater: (prev: Layer[]) => Layer[]
  ) {
    setLayersBySide((prev) => ({
      ...prev,
      [activeSide]: updater(
        prev[activeSide]
      ),
    }));
  }

  /* -------------------------------------------------------------- */
  /* LAYER GESTURES                                                 */
  /* -------------------------------------------------------------- */

  const gestures = useLayerGestures(
    layers,
    setLayers,
    setSelectedId
  );

  /* -------------------------------------------------------------- */
  /* CART -> PREVIEW SYNCHRONIZATION                                */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    function syncFanOrderWithCart() {
      const cart = getCart();

      const cartFanLines = cart.filter(
        (item) =>
          item.productId === "fan" &&
          item.customization?.type ===
            "customized-fan"
      );

      const cartById = new Map(
        cartFanLines.map((item) => [
          item.id,
          item,
        ])
      );

      try {
        cartSnapshotRef.current =
          JSON.stringify(cart);
      } catch {
        cartSnapshotRef.current = "";
      }

      setFanOrderLines((prev) =>
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
            (line): line is FanOrderLine =>
              line !== null
          )
      );
    }

    function handleCartUpdated() {
      syncFanOrderWithCart();
    }

    function handleStorage(
      event: StorageEvent
    ) {
      if (event.key === "cart") {
        syncFanOrderWithCart();
      }
    }

    window.addEventListener(
      "cartUpdated",
      handleCartUpdated
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    syncFanOrderWithCart();

    const pollInterval =
      window.setInterval(() => {
        let currentSnapshot = "";

        try {
          currentSnapshot =
            JSON.stringify(getCart());
        } catch {
          currentSnapshot = "";
        }

        if (
          currentSnapshot !==
          cartSnapshotRef.current
        ) {
          syncFanOrderWithCart();
        }
      }, 150);

    return () => {
      window.removeEventListener(
        "cartUpdated",
        handleCartUpdated
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.clearInterval(
        pollInterval
      );
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* REHYDRATE FAN LINES FROM CART                                  */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    const cart = getCart();

    const existingFanLines: FanOrderLine[] =
      cart
        .filter(
          (item) =>
            item.productId === "fan" &&
            item.customization?.type ===
              "customized-fan"
        )
        .map((item) => {
          const customization =
            item.customization;

          if (
            !customization ||
            customization.type !==
              "customized-fan"
          ) {
            return null;
          }

          return {
            id: item.id,
            tasselColor:
              customization.tasselColor,
            quantity: item.quantity,
            inCart: true,
          };
        })
        .filter(
          (
            line
          ): line is FanOrderLine =>
            line !== null
        );

    if (
      existingFanLines.length ===
      0
    ) {
      return;
    }

    setFanOrderLines((prev) => {
      const existingIds =
        new Set(
          prev.map(
            (line) => line.id
          )
        );

      return [
        ...prev,
        ...existingFanLines.filter(
          (line) =>
            !existingIds.has(
              line.id
            )
        ),
      ];
    });
  }, []);

  /* -------------------------------------------------------------- */
  /* BACKGROUND                                                     */
  /* -------------------------------------------------------------- */

  const hasBackground =
    layers.some(
      (l) =>
        l.type === "fill" ||
        l.type === "pattern"
    );

  const otherSide: SideId =
    activeSide === "front"
      ? "back"
      : "front";

  /* -------------------------------------------------------------- */
  /* ADD TEXT                                                       */
  /* -------------------------------------------------------------- */

  function addText(
    role: "monogram" | "message"
  ) {
    const id = makeId();
    const z = nextZ.current++;

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        role,
        content: role === "monogram" ? "H & M" : "Your Special Day",
        fontSize: role === "monogram" ? 36 : 24,
        font: "vibes",
        color: "#000000",
        bgColor: null,
        bgShape: "rectangle",
        x: 0,
        y: role === "monogram" ? -30 : 30,
        scale: 1,
        rotation: 0,
        z,
      },
    ]);

    setSelectedId(id);
  }

  function addPattern(src: string) {
    const id = makeId();
    const z = nextZ.current++;

    setLayers((prev) => [
      ...prev.filter((l) => l.type !== "pattern" && l.type !== "fill"),
      {
        id,
        type: "pattern",
        src,
        tint: null,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        z,
      },
    ]);

    setSelectedId(id);
  }

  function addSolidFill(colors: string[]) {
    const id = makeId();
    const z = nextZ.current++;

    setLayers((prev) => [
      ...prev.filter((l) => l.type !== "pattern" && l.type !== "fill"),
      {
        id,
        type: "fill",
        colors,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        z,
      },
    ]);

    setSelectedId(id);
  }

  function handleAddToCart() {
    const currentTassel = TASSEL_COLORS.find(
      (t) => t.id === selectedTassel
    ) ?? TASSEL_COLORS[0];

    const newItemId = makeId();

    addToCart({
  id: newItemId,
  productId: "fan",
  productName: "Customized Hand Fan",
  price: PRICE,
  quantity,
  scent: null,
  color: null,
  image: FAN_IMG,
      customization: {
        type: "customized-fan",
        tasselColor: selectedTassel,
        tasselLabel: currentTassel.label,
        layersBySide,
      },
    });

    setFanOrderLines((prev) => [
      ...prev,
      {
        id: newItemId,
        tasselColor: selectedTassel,
        quantity,
        inCart: true,
      },
    ]);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col bg-[#FDFBF7] px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Design Your Custom Hand Fan
          </h1>
          <p className="text-sm text-neutral-500">
            Personalize both sides with text, patterns, or solid fills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSide(activeSide === "front" ? "back" : "front")}
            className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            Editing: <span className="capitalize text-[#DE4B33]">{activeSide}</span> (Switch to {otherSide})
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Preview / Stage Canvas Area */}
        <div className="flex flex-col items-center justify-center lg:col-span-7">
          <div
            ref={stageRef}
            className="relative flex h-[500px] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-inner"
          >
            <img
              src={FAN_IMG}
              alt="Custom Fan Base"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain p-6"
            />
            
            {/* Active Layers Render Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedId(layer.id)}
                  className={`absolute cursor-pointer transition-transform ${
                    selectedId === layer.id ? "ring-2 ring-[#DE4B33] ring-offset-2" : ""
                  }`}
                  style={{
                    transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                    zIndex: layer.z,
                  }}
                >
                  {layer.type === "text" && (
                    <span
                      className={`${getFont(layer.font).className} block whitespace-nowrap`}
                      style={{
                        fontSize: `${layer.fontSize}px`,
                        color: layer.color,
                      }}
                    >
                      {layer.content}
                    </span>
                  )}
                  {layer.type === "fill" && (
                    <div
                      className="h-24 w-24 rounded-full opacity-60"
                      style={{ backgroundColor: layer.colors[0] }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => addText("message")}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow hover:bg-neutral-800"
            >
              + Add Message Text
            </button>
            <button
              onClick={() => addText("monogram")}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              + Add Monogram
            </button>
          </div>
        </div>

        {/* Customization & Controls Toolbar */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Tassel Selection
            </h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TASSEL_COLORS.map((tassel) => (
                <button
                  key={tassel.id}
                  onClick={() => setSelectedTassel(tassel.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition ${
                    selectedTassel === tassel.id
                      ? "border-[#DE4B33] bg-[#FFF5F3] text-[#DE4B33]"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: tassel.hex }}
                  />
                  <span className="truncate">{tassel.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-neutral-900">
                  ${PRICE}.00
                </span>
                <span className="ml-2 text-xs text-neutral-500">per fan</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-neutral-600">Qty:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-center text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-[#DE4B33] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#c73d26] active:scale-[0.98]"
            >
              {addedToCart ? "Added to Cart! ✓" : "Add Custom Fan to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}