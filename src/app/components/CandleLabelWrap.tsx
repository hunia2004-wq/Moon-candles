"use client";

import {
  Great_Vibes,
  Dancing_Script,
  Playfair_Display,
  Caveat,
  Lora,
} from "next/font/google";

// The full label image: white plate, sky photo square and Instagram handle.
export const PLACEHOLDER_IMG_URL =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/cust%20placeholder/candle%20placeholder.jpg";

// Width / height of the label image. ~3:1 from your screenshot. If the plate
// looks squashed or too tall, tweak this number (e.g. 3.2 or 2.8).
const LABEL_ASPECT = 736 / 238;

const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const dancing = Dancing_Script({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"], style: "italic" });

export const LABEL_FONTS = [
  { id: "elegant", name: "Elegant", family: greatVibes.style.fontFamily },
  { id: "flow", name: "Flow", family: dancing.style.fontFamily },
  { id: "classic", name: "Classic", family: playfair.style.fontFamily },
  { id: "hand", name: "Hand", family: caveat.style.fontFamily },
  { id: "soft", name: "Soft", family: lora.style.fontFamily },
] as const;

/**
 * How big the label is on each jar, as a % of the candle image width, and
 * where its centre sits (% from the top of the image).
 * Adjust the numbers per size until it sits inside the glass.
 * Use whatever keys your page uses for the sizes.
 */
export const LABEL_BOX: Record<string, { width: number; centerX: number; centerY: number }> = {
  "150": { width: 75, centerX: 50, centerY: 58 },
  "380": { width: 88, centerX: 51, centerY: 63 },
  default: { width: 90, centerX: 50, centerY: 55 },
};

type PlateProps = {
  message: string;
  onMessageChange?: (v: string) => void;
  photoUrl: string | null;
  onPhotoClick?: () => void;
  fontFamily: string;
  maxLen: number;
};

export function LabelPlate({ message, onMessageChange, photoUrl, onPhotoClick, fontFamily, maxLen }: PlateProps) {
  // cqw = % of the plate's own width, so text shrinks with the plate
  const messageStyle = {
    fontFamily,
    fontSize: "9cqw",
    lineHeight: 1.15,
    color: "#000000",
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-lg shadow-md"
      style={{
        containerType: "inline-size",
        backgroundColor: "#FFFFFF",
        backgroundImage: `url("${PLACEHOLDER_IMG_URL}")`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Message: far left, above the Instagram handle that's part of the image */}
      <div className="absolute flex items-center" style={{ left: "3%", top: "8%", width: "58%", height: "72%" }}>
        {onMessageChange ? (
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value.slice(0, maxLen))}
            placeholder="Your message here"
            className="w-full h-full bg-transparent outline-none resize-none text-left placeholder:text-black/40"
            style={messageStyle}
          />
        ) : (
          <p className="w-full whitespace-pre-wrap break-words" style={messageStyle}>
            {message || "Your message here"}
          </p>
        )}
      </div>

      {/* Photo: sits exactly over the sky square. Tap opens the photo library */}
      <button
        type="button"
        onClick={onPhotoClick}
        className="absolute overflow-hidden"
        style={{ left: "65.8%", top: "10%", width: "27%", height: "83%" }}
        aria-label="Add your photo"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-1">
            <span
              className="rounded-full px-[6%] py-[4%] font-semibold text-center leading-tight"
              style={{
                fontSize: "3.4cqw",
                backgroundColor: "rgba(255,255,255,0.88)",
                color: "#DE4B33",
              }}
            >
              Add your photo here
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

type Props = {
  candleImg: string;
  photoUrl: string | null;
  message: string;
  /** Key into LABEL_BOX, e.g. "150ml" or "380ml" */
  sizeKey?: string;
  curved?: boolean; // accepted for compatibility, not used
  onPhotoZoneClick?: () => void;
  onMessageChange?: (v: string) => void;
  fontId?: string;
  onFontChange?: (id: string) => void;
  maxLen?: number;
    size?: Record<string, unknown>;
};

export default function CandleLabelWrap({
  candleImg,
  photoUrl,
  message,
  sizeKey = "default",
  size,                    // <-- add this line
  onPhotoZoneClick,
  onMessageChange,
  fontId = LABEL_FONTS[0].id,
  onFontChange,
  maxLen = 50,
}: Props) {
  const font = LABEL_FONTS.find((f) => f.id === fontId) ?? LABEL_FONTS[0];
 const { img: _ignore, ...sizeInfo } = (size ?? {}) as Record<string, unknown>;
const sizeText = JSON.stringify(sizeInfo);
const foundKey = Object.keys(LABEL_BOX).find((k) => k !== "default" && sizeText.includes(k));
const box = LABEL_BOX[foundKey ?? sizeKey] ?? LABEL_BOX.default;
  return (
    <div className="w-full max-w-md">
      <div className="relative w-full">
        <img src={candleImg} alt="" className="w-full object-contain" />
        {/* Label sits across the middle of the jar, sized per candle */}
        <div
          className="absolute"
          style={{
            left: `${box.centerX}%`,
            top: `${box.centerY}%`,
            width: `${box.width}%`,
            aspectRatio: `${LABEL_ASPECT} / 1`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <LabelPlate
            message={message}
            onMessageChange={onMessageChange}
            photoUrl={photoUrl}
            onPhotoClick={onPhotoZoneClick}
            fontFamily={font.family}
            maxLen={maxLen}
          />
        </div>
      </div>

      {onFontChange && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {LABEL_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFontChange(f.id)}
              className="rounded-full px-4 py-1.5 text-lg transition-colors"
              style={{
                fontFamily: f.family,
                color: "#000000",
                border: `1.5px solid ${fontId === f.id ? "#DE4B33" : "rgba(0,0,0,0.12)"}`,
                backgroundColor: fontId === f.id ? "#EFE3C4" : "transparent",
              }}
              aria-label={f.name}
            >
              Aa
            </button>
          ))}
        </div>
      )}
    </div>
  );
}