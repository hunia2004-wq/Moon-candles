"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import AutoCenteredImage from "./AutoCenteredImage";

// For products with per-option pricing (e.g. Unscented/Scented at
// different prices), compute the real min–max range from the
// product's actual color/option prices instead of a hardcoded string.
function getPriceRange(product: Product): string | null {
  const prices: number[] = [];

  product.colors?.forEach((color) => {
    if (color.options?.length) {
      color.options.forEach((option) => {
        if (option.price != null) prices.push(option.price);
      });
    } else if (color.price != null) {
      prices.push(color.price);
    }
  });

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return null;

  return `${min}-${max} EGP`;
}

type ActiveDiscount = {
  type: string | null;
  value: number | null;
};

// Products whose picture is a real photo (not a cut-out): shown whole,
// with rounded corners, never cropped or blended.
const PHOTO_PRODUCTS = ["quack and kiss"];

// Products whose "colors" are not real colors (Rustic Warmth only uses its two
// entries to hold the Scented / Unscented photos), so no color dots for them.
const NO_SWATCH_PRODUCTS = ["rustic warmth"];

// Arch color per page: green on Shop All, pink on Candles, blue on Giveaways.
const ARCH_COLORS: Record<string, string> = {
  "#657A55": "#eee4d4", // Shop All: soft beige
  "#D8A1AF": "#eee4d4", // Candles: soft beige
  "#6E86C7": "#eee4d4", // Giveaways: soft beige
};

function archTint(accent: string) {
  return ARCH_COLORS[accent.toUpperCase()] ?? accent;
}

// Picks the arch color from the page's category first, so it is right
// even when the page passes the wrong accent.
function tintFor(category: string | null, accent: string) {
  if (category === "giveaways") return ARCH_COLORS["#6E86C7"];
  if (category === "candles") return ARCH_COLORS["#D8A1AF"];
  return archTint(accent);
}

// A color's picture: its own photo, or else the photo of its first option that
// has one (Bloom Wand keeps each color's wand picture inside "Without Photo").
function colorPhoto(c: unknown): string | null {
  const col = c as {
    image_url?: string;
    image_urls?: string[];
    options?: { image_url?: string; image_urls?: string[] }[];
  };
  const own = col.image_url ?? col.image_urls?.[0];
  if (own) return own;
  for (const o of col.options ?? []) {
    const url = o.image_url ?? o.image_urls?.[0];
    if (url) return url;
  }
  return null;
}

// Same cover fallback the grid always used, plus the option-photo fallback.
function coverOf(p: Product) {
  return (
    p.image_urls?.[0] ??
    (p.colors ?? []).map(colorPhoto).find(Boolean) ??
    undefined
  );
}

type Swatch = {
  key: string;
  name: string;
  hex: string | null;
  img: string | null;
  soldOut: boolean;
  href: string;
};

// Common color names -> dot color. Only used for a color that has no photo.
const NAME_COLORS: Record<string, string> = {
  pink: "#F4A6C0",
  purple: "#8E5BB5",
  white: "#FFFFFF",
  green: "#5FA35B",
  orange: "#F28C28",
  red: "#D62F2F",
  yellow: "#F6D44B",
  blue: "#4F86D6",
  "baby blue": "#A8D0F0",
  "baby pink": "#F7C6D3",
  black: "#1A1A1A",
  fuchsia: "#D63384",
  fuscia: "#D63384",
  "light gray": "#D9D9D9",
  "light grey": "#D9D9D9",
  navy: "#1F2A5A",
};

// Color options of a product, shown under its name as small round pictures of
// the product in that color (falls back to a plain color dot if a color has no
// photo). Each one links to the product page with that color chosen
// (?color=Name). A color marked sold out in the admin is crossed out.
// Products with fewer than two options get none.
function swatchList(product: Product): Swatch[] {
  if (NO_SWATCH_PRODUCTS.includes(product.name.trim().toLowerCase())) return [];

  const map = new Map<string, Swatch>();

  (product.colors ?? []).forEach((c) => {
    const name = (c.name ?? "").trim();
    if (!name) return;

    const img = colorPhoto(c);

    // #CCCCCC is the admin color picker's default, i.e. no real color was chosen.
    const raw = ((c as { hex?: string }).hex ?? "").trim().toLowerCase();
    const picked = raw && raw !== "#cccccc" ? raw : null;
    const hex = picked ?? NAME_COLORS[name.toLowerCase()] ?? null;

    if (!img && !hex) return;

    const key = name.toLowerCase();
    if (map.has(key)) return;

    map.set(key, {
      key,
      name,
      hex,
      img,
      soldOut: !!(c as { sold_out?: boolean }).sold_out,
      href: `/product/${product.id}?color=${encodeURIComponent(name)}`,
    });
  });

  const list = Array.from(map.values());
  return list.length > 1 ? list : [];
}

function Swatches({
  list,
  activeKey = null,
  onSelect,
}: {
  list: Swatch[];
  activeKey?: string | null;
  onSelect?: (key: string) => void;
}) {
  const MAX = 4;
  const shown = list.slice(0, MAX);
  const extra = list.length - shown.length;
  const productHref = list[0]?.href.split("?")[0] ?? "#";

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Color options"
    >
      {shown.map((c) => {
        const active = c.key === activeKey;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect?.(c.key)}
            title={c.soldOut ? `${c.name} (sold out)` : c.name}
            aria-label={c.soldOut ? `${c.name} (sold out)` : c.name}
            aria-pressed={active}
            className="relative block h-6 w-6 overflow-hidden rounded-full transition-transform duration-200 hover:scale-110 md:h-7 md:w-7"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.2)",
              outline: active ? "2px solid #DE4B33" : "none",
              outlineOffset: 1,
              opacity: c.soldOut ? 0.5 : 1,
            }}
          >
            {c.img ? (
              <img src={c.img} alt="" className="h-full w-full object-cover" />
            ) : (
              c.hex && (
                <span
                  aria-hidden="true"
                  className="absolute rounded-full"
                  style={{ inset: "22%", backgroundColor: c.hex }}
                />
              )
            )}
            {c.soldOut && (
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(to top right, transparent 44%, #DE4B33 44%, #DE4B33 56%, transparent 56%)",
                }}
              />
            )}
          </button>
        );
      })}
      {extra > 0 && (
        <Link
          href={productHref}
          aria-label={`${extra} more colors`}
          className="text-[11px] font-semibold"
          style={{ color: "rgba(0,0,0,0.55)" }}
        >
          +{extra}
        </Link>
      )}
    </div>
  );
}
/* ---------- CARD SHELL (arch window) ---------- */

// The color sits on its own layer behind the product. The picture gets a
// square frame centered in the arch, so it is never stretched or squeezed.
function CardShell({
  href,
  linkRef,
  highlight,
  accent,
  tint,
  stage,
  tag,
  soldOut,
  title,
  price,
  chips,
}: {
  href: string;
  linkRef?: (el: HTMLAnchorElement | null) => void;
  highlight?: boolean;
  accent: string;
  tint: string;
  stage: React.ReactNode;
  tag?: string | null;
  soldOut?: boolean;
  title: string;
  price: React.ReactNode;
  chips?: React.ReactNode;
}) {
  
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative w-full">
        <Link href={href} ref={linkRef} className="relative block">
          {/* Color layer: always behind the product */}
         <div
  aria-hidden="true"
  className="absolute inset-0"
  style={{
    backgroundColor: tint,
    border: "1px solid #E2D5C2",
    borderRadius: "50% 50% 24px 24px / 36% 36% 24px 24px",
    boxShadow: highlight ? `0 0 0 3px ${accent}` : "none",
  }}
/>

          {/* Product layer: exactly centered, never squeezed */}
          <div className="relative z-10 flex aspect-[6/7] items-center justify-center p-3">
            <div className="relative flex aspect-square w-full items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.05]">
              {stage}
            </div>
          </div>
        </Link>


      <Link
  href={href}
  className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-wide transition-all duration-300 group-hover:bg-[#DE4B33]"
  style={{
    backgroundColor: "#FFF4E6",
    color: "#000000",
    border: "1px solid #000000",
  }}
>
  {price}
</Link>
      </div>

      <div className="mt-7 w-full">
        {tag && (
          <span
            className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "#DE4B33" }}
          >
            {tag}
          </span>
        )}

 <Link
  href={href}
  className="block font-serif text-[17px] leading-tight md:text-lg"
  style={{ color: "#000000" }}
>
  {title}
</Link>

{soldOut && (
  <div className="mt-2 flex justify-center">
    <span
      className="inline-flex items-center justify-center rounded-full px-3.5 py-1"
      style={{
        color: "#DE4B33",
        border: "1px solid rgba(222,75,51,0.65)",
        fontSize: "8px",
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      Sold Out
    </span>
  </div>
)}

        {chips && <div className="mt-3 flex flex-col items-center gap-2">{chips}</div>}
      </div>
    </div>
  );
}

// Plain text options with a thin underline on the chosen one.
function OptionChip({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap pb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] transition-colors"
      style={{
        color: active ? "#000000" : "rgba(0,0,0,0.38)",
        borderBottom: `1.5px solid ${active ? accent : "transparent"}`,
      }}
    >
      {label}
    </button>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">{children}</div>;
}

// Every picture goes through the auto-centering image, except real photos.
function StageImage({
  src,
  alt,
  photo = false,
}: {
  src: string;
  alt: string;
  photo?: boolean;
}) {
  if (photo) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full rounded-2xl object-contain"
        style={{ objectFit: "contain" }}
      />
    );
  }
  return <AutoCenteredImage src={src} alt={alt} className="h-full w-full object-contain" />;
}

/* ---------- ZOOM BETWEEN SIZES (candles) ---------- */

// Every size picture stays loaded. When the size changes, the new picture
// appears at the OLD size and zooms smoothly to its own size.
function ZoomImage({
  images,
  activeId,
  alt,
}: {
  images: { id: string; src: string; scale: number }[];
  activeId: string;
  alt: string;
}) {
  const scaleOf = (id: string) => images.find((i) => i.id === id)?.scale ?? 1;

  const [shownId, setShownId] = useState(activeId);
  const [scale, setScale] = useState(scaleOf(activeId));
  const [animate, setAnimate] = useState(false);
  const prevId = useRef(activeId);

  useLayoutEffect(() => {
    if (prevId.current === activeId) return;

    const from = scaleOf(prevId.current);
    prevId.current = activeId;

    setAnimate(false);
    setShownId(activeId);
    setScale(from);

    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setAnimate(true);
        setScale(scaleOf(activeId));
      });
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div
      className="h-full w-full mix-blend-multiply"
      style={{
        transform: `scale(${scale})`,
        transition: animate ? "transform 300ms ease" : "none",
      }}
    >
      <div className="relative h-full w-full">
        {images.map((im) => (
          <div
            key={im.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: im.id === shownId ? 1 : 0 }}
          >
            <AutoCenteredImage src={im.src} alt={alt} className="h-full w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- CANDLES WITH TWO SIZES (custom + plain) ---------- */

type CandleSize = {
  id: "small" | "large";
  label: string;
  price: number;
  scale: number;
  img: string;
};

const CUSTOM_SIZES: CandleSize[] = [
  {
    id: "small",
    label: "150 ML",
    price: 450,
    scale: 0.8,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20150.png",
  },
  {
    id: "large",
    label: "380 ML",
    price: 680,
    scale: 1,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/reference%20image%20380.png",
  },
];

const PLAIN_SIZES: CandleSize[] = [
  {
    id: "small",
    label: "150 ML",
    price: 400,
    scale: 0.8,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/150ml.png?v=2",
  },
  {
    id: "large",
    label: "380 ML",
    price: 620,
    scale: 1,
    img: "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/customization%20moon%20candles/380ml.png",
  },
];

function SizedCandleCard({
  title,
  sizes,
  initial,
  hrefFor,
  accent,
  tint,
  swatches,
}: {
  title: string;
  sizes: CandleSize[];
  initial: "small" | "large";
  hrefFor: (id: "small" | "large") => string;
  accent: string;
  tint: string;
  swatches?: Swatch[];
}) {
  const [sizeId, setSizeId] = useState<"small" | "large">(initial);
  const current = sizes.find((s) => s.id === sizeId)!;

  return (
    <CardShell
      href={hrefFor(sizeId)}
      accent={accent}
      tint={tint}
      title={title}
      price={`${current.price} EGP`}
      stage={
        <ZoomImage
          images={sizes.map((s) => ({ id: s.id, src: s.img, scale: s.scale }))}
          activeId={sizeId}
          alt={`${title} ${current.label}`}
        />
      }
      chips={
        <>
          <ChipRow>
            {sizes.map((s) => (
              <OptionChip
                key={s.id}
                label={s.label}
                active={sizeId === s.id}
                accent={accent}
                onClick={() => setSizeId(s.id)}
              />
            ))}
          </ChipRow>
          {swatches && swatches.length > 0 && <Swatches list={swatches} />}
        </>
      }
    />
  );
}

/* ---------- FAN + TAMBOURINE (option cards) ---------- */

function OptionCard({
  href,
  title,
  img,
  alt,
  imgKey,
  accent,
  tint,
  chipRows,
  price,
  scale = 1,
  blend = true,
}: {
  href: string;
  title: string;
  img?: string;
  alt: string;
  imgKey: string;
  accent: string;
  tint: string;
  chipRows: React.ReactNode[];
  price: number;
  scale?: number;
  blend?: boolean;
}) {
  return (
    <CardShell
      href={href}
      accent={accent}
      tint={tint}
      title={title}
      price={`${price} EGP`}
      stage={
        img ? (
          <div
            className={`flex h-full w-full items-center justify-center ${
              blend ? "mix-blend-multiply" : ""
            }`}
            style={{
              transform: `scale(${scale})`,
              transition: "transform 300ms ease",
            }}
          >
            <StageImage key={imgKey} src={img} alt={alt} />
          </div>
        ) : null
      }
      chips={
        <>
          {chipRows.map((row, i) => (
            <ChipRow key={i}>{row}</ChipRow>
          ))}
        </>
      }
    />
  );
}

/* ---------- CUSTOM FAN (two sizes, customize only) ---------- */

// Same picture for both sizes, so the large one is drawn a little bigger.
const FAN_SIZES = [
  { id: "small", label: "Small", price: 25, img: "", scale: 1 },
  { id: "large", label: "Large", price: 35, img: "", scale: 1.15 },
] as const;

function FanCard({
  product,
  accent,
  tint,
}: {
  product: Product;
  accent: string;
  tint: string;
}) {
  const [sizeId, setSizeId] = useState<"small" | "large">("small");
  const current = FAN_SIZES.find((s) => s.id === sizeId)!;

  return (
    <OptionCard
      href={`/customize/fan?size=${sizeId}`}
      title="Custom Fan"
      img={current.img || coverOf(product)}
      blend={false}
      alt={`Custom Fan ${current.label}`}
      imgKey="fan"
      accent={accent}
      tint={tint}
      price={current.price}
      scale={current.scale}
      chipRows={[
        FAN_SIZES.map((s) => (
          <OptionChip
            key={s.id}
            label={s.label}
            active={sizeId === s.id}
            accent={accent}
            onClick={() => setSizeId(s.id)}
          />
        )),
      ]}
    />
  );
}

/* ---------- TAMBOURINE (plain or customizable, two sizes) ---------- */

type TambType = "plain" | "custom";
type TambSize = "small" | "large";

// Customized prices come from the customizer. Plain prices come from the
// product's own size options (95 / 140), with these as a fallback.
const TAMB_CUSTOM_PRICES: Record<TambSize, number> = { small: 100, large: 145 };
const TAMB_PLAIN_FALLBACK: Record<TambSize, number> = { small: 95, large: 140 };

const TAMB_SIZE_LABELS: Record<TambSize, string> = { small: "12 cm", large: "20 cm" };

// The pictures are all cropped to the same frame, so the 12 cm one is drawn
// smaller to show the real size difference (12 / 20 = 0.6).
// Make it smaller for a bigger gap, closer to 1 for a smaller gap.
const TAMB_SMALL_SCALE = 0.6;

function TambourineCard({
  product,
  accent,
  tint,
}: {
  product: Product;
  accent: string;
  tint: string;
}) {
  const [type, setType] = useState<TambType>("custom");
  const [sizeId, setSizeId] = useState<TambSize>("small");

  // Find the 12 cm / 20 cm option on the product (falls back to its position).
  const sizeOption = (s: TambSize) => {
    const colors = product.colors ?? [];
    return (
      colors.find((c) => (c.name ?? "").includes(s === "small" ? "12" : "20")) ??
      colors[s === "small" ? 0 : 1]
    );
  };

  const option = sizeOption(sizeId);
  const urls: string[] = option?.image_urls ?? [];

  // First image of each size = plain, second image = customized preview.
  const plainImg = urls[0];
  const customImg = urls[1] ?? urls[0];

  const img = type === "custom" ? customImg : plainImg;
  const price =
    type === "custom"
      ? TAMB_CUSTOM_PRICES[sizeId]
      : option?.price ?? TAMB_PLAIN_FALLBACK[sizeId];

  const scale = sizeId === "small" ? TAMB_SMALL_SCALE : 1;

  const href =
    type === "plain" ? `/product/${product.id}` : `/customize/tambourine?size=${sizeId}`;

  return (
    <OptionCard
      href={href}
      title="Tambourine"
      img={img}
      scale={scale}
      alt={`Tambourine ${type} ${TAMB_SIZE_LABELS[sizeId]}`}
      imgKey={`${type}-${sizeId}`}
      accent={accent}
      tint={tint}
      price={price}
      chipRows={[
        [
          <OptionChip
            key="plain"
            label="Plain"
            active={type === "plain"}
            accent={accent}
            onClick={() => setType("plain")}
          />,
          <OptionChip
            key="custom"
            label="Customizable"
            active={type === "custom"}
            accent={accent}
            onClick={() => setType("custom")}
          />,
        ],
        (["small", "large"] as const).map((s) => (
          <OptionChip
            key={s}
            label={TAMB_SIZE_LABELS[s]}
            active={sizeId === s}
            accent={accent}
            onClick={() => setSizeId(s)}
          />
        )),
      ]}
    />
  );
}

/* ---------- SHOP CARD (switches picture when a color is pressed) ---------- */

function ShopCard({
  product,
  accent,
  tint,
  priceNode,
  badgeLabel,
  soldOut,
  highlight,
  isPhoto,
  linkRef,
}: {
  product: Product;
  accent: string;
  tint: string;
  priceNode: React.ReactNode;
  badgeLabel: string | null;
  soldOut: boolean;
  highlight: boolean;
  isPhoto: boolean;
  linkRef: (el: HTMLAnchorElement | null) => void;
}) {
  const swatches = swatchList(product);
  const baseCover = coverOf(product);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const picked = swatches.find((sw) => sw.key === pickedKey) ?? null;

  // Before anything is pressed, the color whose photo is already showing is marked.
  const shownKey =
    picked?.key ?? swatches.find((sw) => sw.img && sw.img === baseCover)?.key ?? null;
  const shown = swatches.find((sw) => sw.key === shownKey) ?? null;

  const cover = picked?.img ?? baseCover;
  const href = picked ? picked.href : `/product/${product.id}`;
  const showSoldOut = soldOut || !!shown?.soldOut;

  return (
    <CardShell
      href={href}
      linkRef={linkRef}
      highlight={highlight}
      accent={accent}
      tint={tint}
      title={product.name}
      price={priceNode}
      tag={badgeLabel}
      soldOut={showSoldOut}
      chips={
        swatches.length > 0 ? (
          <Swatches
            list={swatches}
            activeKey={shownKey}
            onSelect={(key) => {
              // A color with no photo has nothing to switch to, so it is ignored.
              const sw = swatches.find((x) => x.key === key);
              if (sw?.img) setPickedKey(key);
            }}
          />
        ) : undefined
      }
      stage={
        cover ? (
          <div
            className={`flex h-full w-full items-center justify-center transition-opacity ${
              showSoldOut ? "opacity-45 grayscale" : ""
            } ${isPhoto ? "" : "mix-blend-multiply"}`}
          >
            <StageImage key={cover} src={cover} alt={product.name} photo={isPhoto} />
          </div>
        ) : null
      }
    />
  );
}

/* ---------- SHOP GRID ---------- */

export default function ShopGrid({
  products,
  accent = "#657A55",
}: {
  products: Product[];
  accent?: string;
}) {
  const searchParams = useSearchParams();
  const targetProduct = searchParams.get("product");
  const category = searchParams.get("category"); // "candles" | "giveaways" | null
  const refs = useRef<Record<number, HTMLAnchorElement | null>>({});
  const [discountsByProduct, setDiscountsByProduct] = useState<Record<number, ActiveDiscount>>({});

  useEffect(() => {
    if (!targetProduct) return;
    const match = products.find((p) => p.name === targetProduct);
    if (match && refs.current[match.id]) {
      refs.current[match.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetProduct, products]);

  // Pulls every active promotion currently attached to any product, and
  // builds a map of productId -> discount so cards can show a struck-through
  // original price next to the discounted one. Runs once on mount; since
  // it queries live, a promotion the owner activates/deactivates later is
  // picked up on the shop page's next load without any code changes.
  useEffect(() => {
    loadActiveDiscounts();
  }, []);

  async function loadActiveDiscounts() {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id, promotions(discount_type, discount_value, is_active, starts_at, ends_at)");

    if (error) {
      console.error("Failed to load promotion discounts:", error.message);
      return;
    }

    if (!data) return;

    const map: Record<number, ActiveDiscount> = {};

    for (const row of data as any[]) {
      const promo = row.promotions;
      if (!promo || !promo.is_active) continue;
      if (promo.starts_at && promo.starts_at > nowIso) continue;
      if (promo.ends_at && promo.ends_at < nowIso) continue;

      map[row.product_id] = {
        type: promo.discount_type,
        value: promo.discount_value,
      };
    }

    setDiscountsByProduct(map);
  }

  const showCustomCard = !category || category === "candles";

  const filteredProducts = products.filter((product) => {
    if (product.category === "customizable") return false;
    if (!category) return true;
    if (category === "giveaways") return product.category === "giveaway";
    if (category === "candles") return product.category === "candle";
    return true;
  });

  if (filteredProducts.length === 0 && !showCustomCard) {
    return <p style={{ color: "#000000" }}>No products available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-8">
      {filteredProducts.map((product) => {
               const tint = tintFor(category, accent);
        const isTarget = product.name === targetProduct;
        const soldOut = !!(product as Product & { out_of_stock?: boolean | null }).out_of_stock;
        const priceOverride = getPriceRange(product);

        if (product.id === 21) {
          return (
            <SizedCandleCard
              key={product.id}
              title={product.name}
              sizes={PLAIN_SIZES}
              initial="small"
              hrefFor={() => `/product/${product.id}`}
              accent={accent}
              tint={tint}
              swatches={swatchList(product)}
            />
          );
        }

        const nameKey = product.name.trim().toLowerCase();

        if (nameKey === "fan") {
          return <FanCard key={product.id} product={product} accent={accent} tint={tint} />;
        }

        if (nameKey === "tambourine") {
          return <TambourineCard key={product.id} product={product} accent={accent} tint={tint} />;
        }

        const discount = discountsByProduct[product.id];
        let discountedPrice: number | null = null;
        if (discount && !priceOverride) {
          if (discount.type === "percentage" && discount.value != null) {
            discountedPrice = Math.round(product.price * (1 - discount.value / 100));
          } else if (discount.type === "fixed" && discount.value != null) {
            discountedPrice = Math.max(0, product.price - discount.value);
          }
        }

        // Tag label for every discount type — percentage/fixed also get
        // a recalculated price above; BOGO and free shipping are
        // tag-only, since there's no single-item price to change.
        let badgeLabel: string | null = null;
        if (discount?.type === "percentage" && discount.value != null) {
          badgeLabel = `${discount.value}% off`;
        } else if (discount?.type === "fixed" && discount.value != null) {
          badgeLabel = `${discount.value} EGP off`;
        } else if (discount?.type === "bogo") {
          badgeLabel = "Buy 1 get 1";
        } else if (discount?.type === "free_shipping") {
          badgeLabel = "Free shipping";
        }

        const isPhoto = PHOTO_PRODUCTS.includes(nameKey);

        const priceNode = priceOverride ? (
          priceOverride
        ) : discountedPrice != null ? (
          <>
            <span style={{ opacity: 0.55, textDecoration: "line-through", marginRight: 6 }}>
              {product.price}
            </span>
            <span style={{ fontWeight: 700 }}>{discountedPrice} EGP</span>
          </>
        ) : (
          `${product.price} EGP`
        );

        return (
          <ShopCard
            key={product.id}
            product={product}
            accent={accent}
            tint={tint}
            priceNode={priceNode}
            badgeLabel={badgeLabel}
            soldOut={soldOut}
            highlight={isTarget}
            isPhoto={isPhoto}
            linkRef={(el) => {
              refs.current[product.id] = el;
            }}
          />
        );
      })}

      {showCustomCard && (
        <SizedCandleCard
          title="Custom Candle"
          sizes={CUSTOM_SIZES}
          initial="large"
          hrefFor={(id) => `/customize?size=${id}`}
          accent={accent}
                   tint={tintFor(category, accent)}
        />
      )}
    </div>
  );
}