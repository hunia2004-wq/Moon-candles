"use client";

import { useState, useRef } from "react";
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

/* ------------------------------------------------------------------ */
/* Fonts                                                              */
/* ------------------------------------------------------------------ */

const FONTS = [
  { id: "vibes", label: "Great Vibes", short: "Vibes", className: greatVibes.className, previewSize: 17 },
  { id: "dancing", label: "Dancing Script", short: "Dancing", className: dancingScript.className, previewSize: 16 },
  { id: "sacramento", label: "Sacramento", short: "Sacramento", className: sacramento.className, previewSize: 17 },
  { id: "playfair", label: "Playfair Display", short: "Playfair", className: playfair.className, previewSize: 15 },
  { id: "bitter", label: "Bitter Slab", short: "Slab", className: bitter.className, previewSize: 15 },
  { id: "baskerville", label: "Libre Baskerville", short: "Baskerville", className: libreBaskerville.className, previewSize: 13 },
  { id: "poppins", label: "Poppins", short: "Poppins", className: poppins.className, previewSize: 14 },
  { id: "oswald", label: "Oswald", short: "Oswald", className: oswald.className, previewSize: 15 },
  { id: "archivo", label: "Archivo Black", short: "Archivo", className: archivoBlack.className, previewSize: 14 },
  { id: "abril", label: "Abril Fatface", short: "Abril", className: abrilFatface.className, previewSize: 15 },
  { id: "bebas", label: "Bebas Neue", short: "Bebas", className: bebasNeue.className, previewSize: 17 },
  { id: "righteous", label: "Righteous", short: "Righteous", className: righteous.className, previewSize: 14 },
  { id: "pacifico", label: "Pacifico", short: "Pacifico", className: pacifico.className, previewSize: 14 },
  { id: "mono", label: "Space Mono", short: "Mono", className: spaceMono.className, previewSize: 12 },
  { id: "marker", label: "Permanent Marker", short: "Marker", className: permanentMarker.className, previewSize: 13 },
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
          <span key={group.category} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: CATEGORY_COLORS[group.category],
              }}
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

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CustomizeFanPage() {
  const [activeSide, setActiveSide] = useState<SideId>("front");

  const [layersBySide, setLayersBySide] = useState<
    Record<SideId, Layer[]>
  >({
    front: defaultLayersForSide(),
    back: defaultLayersForSide(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const nextZ = useRef(1);
  const patternFileInputRef = useRef<HTMLInputElement>(null);

  const layers = layersBySide[activeSide];

  function setLayers(updater: (prev: Layer[]) => Layer[]) {
    setLayersBySide((prev) => ({
      ...prev,
      [activeSide]: updater(prev[activeSide]),
    }));
  }

  /* -------------------------------------------------------------- */
  /* LAYER GESTURES                                                 */
  /* -------------------------------------------------------------- */

  // Third arg re-selects a layer the instant it's pressed, so tapping a
  // design you already placed lets you edit it again (fixes it being
  // stuck deselected / uneditable).
  const gestures = useLayerGestures(layers, setLayers, setSelectedId);

  /* -------------------------------------------------------------- */
  /* CHECK WHETHER CURRENT SIDE ALREADY HAS A BACKGROUND             */
  /* -------------------------------------------------------------- */

  const hasBackground = layers.some(
    (l) => l.type === "fill" || l.type === "pattern"
  );

  const otherSide: SideId =
    activeSide === "front" ? "back" : "front";

  /* ---------------------------------------------------------------- */
  /* Add text                                                         */
  /* ---------------------------------------------------------------- */

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
        font: role === "monogram" ? "playfair" : "poppins",
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

  /* ---------------------------------------------------------------- */
  /* Add fill                                                         */
  /* ---------------------------------------------------------------- */

  function addFill() {
    const id = makeId();

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "fill",
        colors: [ACCENT],
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        z: 0,
      },
    ]);

    setSelectedId(id);
  }

  /* ---------------------------------------------------------------- */
  /* Upload pattern                                                   */
  /* ---------------------------------------------------------------- */

  function handlePatternUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image under 8MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const id = makeId();

    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "pattern",
        src: url,
        tint: null,
        // x/y are the photo's own pan (50 = centered / no pan) and
        // scale is its own zoom (1 = fully covers the fan, so it's
        // never cropped until the person pinches to zoom in
        // themselves). The fan-shaped mask itself is always fixed to
        // the fan artwork's own box — see renderLayer.
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        z: 0,
      },
    ]);

    setSelectedId(id);

    e.target.value = "";
  }

  /* ---------------------------------------------------------------- */
  /* Apply layer to both sides                                        */
  /* ---------------------------------------------------------------- */

  function applyToBothSides(layer: Layer) {
    const copy = {
      ...layer,
      id: makeId(),
      z: layer.type === "text" ? nextZ.current++ : 0,
    } as Layer;

    setLayersBySide((prev) => ({
      ...prev,
      [otherSide]:
        layer.type === "text"
          ? [...prev[otherSide], copy]
          : [
              ...prev[otherSide].filter(
                (l) => l.type !== layer.type
              ),
              copy,
            ],
    }));
  }

  /* ---------------------------------------------------------------- */
  /* Update layer                                                     */
  /* ---------------------------------------------------------------- */

  function updateLayer(
    id: string,
    patch: Partial<Layer>
  ) {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id
          ? ({ ...l, ...patch } as Layer)
          : l
      )
    );
  }

  /* ---------------------------------------------------------------- */
  /* Remove layer                                                     */
  /* ---------------------------------------------------------------- */

  function removeLayer(id: string) {
    setLayers((prev) =>
      prev.filter((l) => l.id !== id)
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Fill colors                                                      */
  /* ---------------------------------------------------------------- */

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
        if (l.id !== id || l.type !== "fill") {
          return l;
        }

        const colors = [...l.colors];
        colors[index] = color;

        return {
          ...l,
          colors,
        };
      })
    );
  }

  function removeFillColor(
    id: string,
    index: number
  ) {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || l.type !== "fill") {
          return l;
        }

        if (l.colors.length <= 1) {
          return l;
        }

        return {
          ...l,
          colors: l.colors.filter(
            (_, i) => i !== index
          ),
        };
      })
    );
  }

  /* ---------------------------------------------------------------- */
  /* ADD FAN TO CART                                                  */
  /* ---------------------------------------------------------------- */

  function addFanToCart() {
    const cartItem = {
      id: makeId(),
      productName: "Fan",
      price: PRICE,
      quantity,

      design: {
        front: layersBySide.front,
        back: layersBySide.back,
      },
    };

    const existingCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    localStorage.setItem(
      "cart",
      JSON.stringify([
        ...existingCart,
        cartItem,
      ])
    );

    setAddedToCart(true);

    setQuantity(1);

    setLayersBySide({
      front: defaultLayersForSide(),
      back: defaultLayersForSide(),
    });

    setSelectedId(null);
    setShowPreview(false);

    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  }

  const selectedLayer =
    layers.find((l) => l.id === selectedId) ??
    null;

  /* ---------------------------------------------------------------- */
  /* Background shape styles                                         */
  /* ---------------------------------------------------------------- */

  function bgShapeStyle(
    shape: TextLayer["bgShape"],
    hasContent: boolean
  ): React.CSSProperties {
    if (!hasContent) {
      return {};
    }

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

  /* ---------------------------------------------------------------- */
  /* Render layer                                                     */
  /* ---------------------------------------------------------------- */

  function renderLayer(
    layer: Layer,
    interactive: boolean
  ) {
    const isSelected =
      interactive && layer.id === selectedId;

    /*
     * The mask/frame below is always `position:absolute; inset:0` —
     * i.e. it exactly overlays the fan <img>'s own box (the stage
     * sizes itself to the image via h-auto), and the mask is drawn at
     * maskSize 100% 100% instead of "contain". That's what makes the
     * colored/pattern layer align pixel-for-pixel with the real fan
     * artwork, including the top corners, instead of being
     * letterboxed into a smaller guessed region.
     */
    const frameStyle: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      outline: isSelected
        ? `1.5px dashed ${ACCENT}`
        : "none",
      outlineOffset: "4px",
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

    /* -------------------------------------------------------------- */
    /* Fill layer — fixed frame, always fully covers the fan           */
    /* -------------------------------------------------------------- */

    if (layer.type === "fill") {
      const background =
        layer.colors.length === 1
          ? layer.colors[0]
          : `linear-gradient(135deg, ${layer.colors.join(
              ", "
            )})`;

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
            cursor: interactive ? "pointer" : "default",
          }}
        >
          <div
            style={{
              ...maskWrapperStyle,
              background,
            }}
          />
        </div>
      );
    }

    /* -------------------------------------------------------------- */
    /* Pattern layer — fixed frame, photo pans/zooms independently     */
    /* -------------------------------------------------------------- */

    if (layer.type === "pattern") {
      const zoom = layer.scale;
      const maxPanPct = (zoom - 1) * 50;
      const offsetX = ((layer.x - 50) / 50) * maxPanPct;
      const offsetY = ((layer.y - 50) / 50) * maxPanPct;

      return (
        <div
          key={layer.id}
          onPointerDown={
            interactive
              ? gestures.onPointerDown(layer.id, stageRef.current, {
                  minScale: 1,
                  maxScale: 3,
                })
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
              ? gestures.onWheelZoom(layer.id, {
                  minScale: 1,
                  maxScale: 3,
                })
              : undefined
          }
          style={{
            ...frameStyle,
            cursor: interactive ? "grab" : "default",
            touchAction: "none",
          }}
        >
          <div style={maskWrapperStyle}>
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
        </div>
      );
    }

    /* -------------------------------------------------------------- */
    /* Text layer — freely draggable/pinchable, unchanged              */
    /* -------------------------------------------------------------- */

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
        onPointerDown={
          interactive
            ? gestures.onPointerDown(
                layer.id,
                stageRef.current
              )
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
          fontWeight:
            layer.role === "monogram" ? 700 : 500,
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

  /* ---------------------------------------------------------------- */
  /* JSX                                                              */
  /* ---------------------------------------------------------------- */

  return (
    <div
      style={{ backgroundColor: "#FFF4E6" }}
      className="w-full min-h-screen"
    >
      {/* ============================================================ */}
      {/* TOP: LIVE EDITOR                                             */}
      {/* ============================================================ */}

      <div className="flex flex-col items-center px-6 py-8">

        {/* Front / Back */}
        <div className="flex gap-2 mb-4">
          {(["front", "back"] as SideId[]).map(
            (id) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSide(id);
                  setSelectedId(null);
                }}
                className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  backgroundColor:
                    activeSide === id
                      ? ACCENT
                      : "#FFFFFF",
                  color:
                    activeSide === id
                      ? "#FFF4E6"
                      : ACCENT,
                  border: `1px solid ${ACCENT}`,
                }}
              >
                {id === "front"
                  ? "Front"
                  : "Back"}
              </button>
            )
          )}
        </div>

        {/* Fan stage */}
        <div
          ref={stageRef}
          className="relative w-full max-w-[300px] md:max-w-[380px] touch-none select-none"
          onClick={(e) => {
            if (e.target === stageRef.current) {
              setSelectedId(null);
            }
          }}
        >
          <img
            src={FAN_IMG}
            alt={`Fan — ${activeSide}`}
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

        {/* ========================================================== */}
        {/* SELECTED LAYER CONTROLS                                   */}
        {/* ========================================================== */}

        {selectedLayer && (
          <div
            className="mt-4 flex w-full max-w-[320px] flex-col gap-3 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "#EFE3C4",
            }}
          >
            {/* UNDO */}
            <button
              onClick={gestures.undo}
              disabled={!gestures.canUndo()}
              className="text-left text-xs font-medium underline disabled:opacity-30"
              style={{ color: ACCENT }}
            >
              ↺ Undo
            </button>

            {/* TEXT */}
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
                  placeholder={
                    selectedLayer.role ===
                    "monogram"
                      ? "Your initials"
                      : "Your message"
                  }
                />

                <div>
                  <span
                    className="mb-1.5 block text-[11px] font-medium"
                    style={{
                      color:
                        "rgba(0,0,0,0.55)",
                    }}
                  >
                    Font
                  </span>

                  <FontPicker
                    value={
                      selectedLayer.font
                    }
                    previewText={
                      selectedLayer.content
                    }
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
              No more scale slider — every layer (text, fill, pattern)
              is resized with a two-finger pinch directly on the fan,
              and moved with a one-finger drag. Pattern layers can
              never zoom out past "fully covers the fan" so nothing
              gets cropped without the person choosing to.
            */}

            {/* PATTERN TINT */}
            {selectedLayer.type ===
              "pattern" && (
              <div className="flex items-center gap-2">
                <span
                  className="w-14 text-[11px]"
                  style={{
                    color:
                      "rgba(0,0,0,0.55)",
                  }}
                >
                  Tint
                </span>

                <div className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() =>
                      updateLayer(
                        selectedLayer.id,
                        {
                          tint: null,
                        }
                      )
                    }
                    className="h-6 w-6 flex-shrink-0 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor:
                        "#FFFFFF",
                      backgroundImage:
                        "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                      borderColor:
                        selectedLayer.tint ===
                        null
                          ? "#000000"
                          : "rgba(0,0,0,0.3)",
                      borderWidth:
                        selectedLayer.tint ===
                        null
                          ? 2
                          : 1,
                    }}
                    title="No tint"
                  />

                  <ColorWheelPicker
                    value={
                      selectedLayer.tint ??
                      ACCENT
                    }
                    onChange={(c) =>
                      updateLayer(
                        selectedLayer.id,
                        {
                          tint: c,
                        }
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
                    tap the wheel to pick any
                    color
                  </span>
                </div>
              </div>
            )}

            {/* FILL COLORS */}
            {selectedLayer.type ===
              "fill" && (
              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px]"
                  style={{
                    color:
                      "rgba(0,0,0,0.55)",
                  }}
                >
                  {selectedLayer.colors
                    .length === 1
                    ? "Color"
                    : "Colors (blended)"}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedLayer.colors.map(
                    (c, i) => (
                      <div
                        key={i}
                        className="relative"
                      >
                        <ColorWheelPicker
                          value={c}
                          onChange={(
                            newC
                          ) =>
                            updateFillColor(
                              selectedLayer.id,
                              i,
                              newC
                            )
                          }
                        />

                        {selectedLayer
                          .colors
                          .length > 1 && (
                          <button
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
                              color:
                                "#FFFFFF",
                            }}
                            title="Remove this color"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}

                  <button
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
                    color:
                      "rgba(0,0,0,0.45)",
                  }}
                >
                  Add more than one color to
                  blend them together.
                </span>
              </div>
            )}

            {/* TEXT COLOR + BACKING */}
            {selectedLayer.type ===
              "text" && (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="w-14 text-[11px]"
                    style={{
                      color:
                        "rgba(0,0,0,0.55)",
                    }}
                  >
                    Color
                  </span>

                  <ColorWheelPicker
                    value={
                      selectedLayer.color
                    }
                    onChange={(c) =>
                      updateLayer(
                        selectedLayer.id,
                        {
                          color: c,
                        }
                      )
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-14 text-[11px]"
                    style={{
                      color:
                        "rgba(0,0,0,0.55)",
                    }}
                  >
                    Backing
                  </span>

                  <div className="flex flex-1 items-center gap-2">
                    <button
                      onClick={() =>
                        updateLayer(
                          selectedLayer.id,
                          {
                            bgColor: null,
                          }
                        )
                      }
                      className="h-6 w-6 flex-shrink-0 rounded-full border transition-transform hover:scale-110"
                      style={{
                        backgroundColor:
                          "#FFFFFF",
                        backgroundImage:
                          "linear-gradient(45deg, transparent 45%, red 45%, red 55%, transparent 55%)",
                        borderColor:
                          selectedLayer.bgColor ===
                          null
                            ? "#000000"
                            : "rgba(0,0,0,0.3)",
                        borderWidth:
                          selectedLayer.bgColor ===
                          null
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
                          {
                            bgColor: c,
                          }
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

                {/* BACKING SHAPE */}
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
                      {BG_SHAPES.map(
                        (s) => (
                          <button
                            key={s.id}
                            onClick={() =>
                              updateLayer(
                                selectedLayer.id,
                                {
                                  bgShape:
                                    s.id,
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
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* BOTH SIDES */}
            <button
              onClick={() =>
                applyToBothSides(
                  selectedLayer
                )
              }
              className="text-[11px] font-medium underline text-left transition-all duration-150 hover:scale-[1.03] active:scale-[0.95] hover:opacity-70"
              style={{
                color: ACCENT,
              }}
            >
              apply this to both sides
            </button>

            {/* DELETE */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() =>
                  removeLayer(
                    selectedLayer.id
                  )
                }
                className="text-[11px] font-medium underline"
                style={{
                  color:
                    "rgba(0,0,0,0.5)",
                }}
              >
                delete
              </button>
            </div>
          </div>
        )}

        <p
          className="text-center text-[11px] mt-3 max-w-xs"
          style={{
            color: "rgba(0,0,0,0.45)",
          }}
        >
          Tap an item below to add it, then use one finger to move it and
          two fingers to pinch-zoom it into place on the {activeSide}.
        </p>
      </div>

      {/* ============================================================ */}
      {/* ASSET PALETTE                                                */}
      {/* ============================================================ */}

      <div className="px-6 md:px-12 py-8 max-w-2xl mx-auto">

        {/* ========================================================== */}
        {/* BACKGROUND OPTIONS                                         */}
        {/* ========================================================== */}

        {!hasBackground && (
          <>
            {/* COLOR */}
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: ACCENT }}
            >
              Color your fan
            </p>

            <div className="flex gap-3 mb-8">
              <button
                onClick={addFill}
                className="flex-1 flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-colors"
                style={{
                  border: `1.5px solid ${ACCENT}`,
                  backgroundColor: "#EFE3C4",
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
                    color: "rgba(0,0,0,0.62)",
                  }}
                >
                  Add a solid color or blend
                  <br />

                  <span className="text-[11px]">
                    Pick one color, or add more to
                    blend them.
                  </span>
                </span>
              </button>
            </div>

            {/* PATTERN */}
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: ACCENT }}
            >
              Use your own pattern
            </p>

            <button
              onClick={() =>
                patternFileInputRef.current?.click()
              }
              className="w-full flex items-center gap-3 rounded-xl px-4 py-4 mb-8 text-left transition-colors"
              style={{
                border: `1.5px dashed ${ACCENT}`,
                backgroundColor: "#EFE3C4",
              }}
            >
              <UploadIcon />

              <span
                className="text-xs md:text-sm"
                style={{
                  color: "rgba(0,0,0,0.62)",
                }}
              >
                Upload your own photo or pattern
                <br />

                <span className="text-[11px]">
                  It'll be shaped to fit the fan
                  automatically — pinch to zoom and
                  drag to reposition it once it's
                  added.
                </span>
              </span>
            </button>

            <input
              ref={patternFileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePatternUpload}
            />
          </>
        )}

        {hasBackground && (
          <p
            className="mb-4 text-xs"
            style={{ color: "rgba(0,0,0,0.5)" }}
          >
            Background added — delete it from the stage above
            to choose a different type.
          </p>
        )}

        {/* TEXT */}
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: ACCENT }}
        >
          Add text
        </p>

        <div className="flex gap-3 mb-10">
          <button
            onClick={() =>
              addText("monogram")
            }
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
            }}
          >
            + Monogram / Names
          </button>

          <button
            onClick={() =>
              addText("message")
            }
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
            }}
          >
            + Message
          </button>
        </div>

        {/* PREVIEW BUTTON */}
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              setShowPreview(true)
            }
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90 active:brightness-75"
            style={{
              backgroundColor: ACCENT,
              color: "#FFF4E6",
            }}
          >
            Preview my fan
          </button>

          <span
            className="text-lg font-semibold"
            style={{ color: "#000000" }}
          >
            {PRICE} LE
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FULL SCREEN PREVIEW                                          */}
      {/* ============================================================ */}

      {showPreview && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 px-6 py-10 overflow-y-auto"
          style={{
            backgroundColor: "#FFF4E6",
          }}
        >
          {/* CLOSE */}
          <button
            onClick={() =>
              setShowPreview(false)
            }
            className="absolute top-6 right-6 text-2xl transition-all duration-150 hover:scale-110 active:scale-90 hover:opacity-70"
            style={{
              color: "#000000",
            }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* FRONT + BACK */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            {(["front", "back"] as SideId[]).map(
              (id) => (
                <div
                  key={id}
                  className="flex flex-col items-center gap-2"
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{
                      color: ACCENT,
                    }}
                  >
                    {id === "front"
                      ? "Front"
                      : "Back"}
                  </p>

                  <div className="relative w-full max-w-[240px] md:max-w-[280px]">
                    <img
                      src={FAN_IMG}
                      alt=""
                      className="w-full h-auto"
                      draggable={false}
                    />

                    {layersBySide[id]
                      .slice()
                      .sort(
                        (a, b) =>
                          a.z - b.z
                      )
                      .map((layer) =>
                        renderLayer(
                          layer,
                          false
                        )
                      )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* ======================================================== */}
          {/* QUANTITY                                                 */}
          {/* ======================================================== */}

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <span
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{
                  color: ACCENT,
                }}
              >
                Quantity
              </span>

              <div
                className="flex items-center rounded-full px-1 py-1"
                style={{
                  backgroundColor:
                    "#FFFFFF",
                  border: `1px solid ${ACCENT}`,
                }}
              >
                {/* MINUS */}
                <button
                  onClick={() =>
                    setQuantity((q) =>
                      Math.max(
                        1,
                        q - 1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor:
                      "#EFE3C4",
                    color: "#000000",
                  }}
                >
                  −
                </button>

                {/* NUMBER */}
                <span
                  className="w-10 text-center text-sm font-semibold"
                  style={{
                    color: "#000000",
                  }}
                >
                  {quantity}
                </span>

                {/* PLUS */}
                <button
                  onClick={() =>
                    setQuantity(
                      (q) => q + 1
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor:
                      "#EFE3C4",
                    color: "#000000",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* TOTAL */}
            <p
              className="text-lg font-bold"
              style={{
                color: ACCENT,
              }}
            >
              {PRICE * quantity} LE
            </p>

            {/* ADD TO CART */}
            <button
              onClick={addFanToCart}
              className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] hover:brightness-90"
              style={{
                backgroundColor: ACCENT,
                color: "#FFF4E6",
              }}
            >
              Add {quantity}{" "}
              {quantity === 1
                ? "Fan"
                : "Fans"}{" "}
              to Cart
            </button>

            {/* SUCCESS */}
            {addedToCart && (
              <p
                className="text-xs font-medium"
                style={{
                  color: "#6E86C7",
                }}
              >
                Added to cart ✓
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Upload icon                                                        */
/* ------------------------------------------------------------------ */

function UploadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#DE4B33"
      strokeWidth="1.6"
    >
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <rect
        x="3"
        y="16"
        width="18"
        height="5"
        rx="1"
      />
    </svg>
  );
}