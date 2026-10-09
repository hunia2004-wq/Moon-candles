"use client";

import { useEffect, useRef, useState } from "react";

const SAND = "#EFE3C4";
const ACCENT = "#DE4B33";

type Props = {
  src: string;
  alt?: string;
  className?: string; // size and shape, e.g. "h-14 w-14 rounded-lg"
  imgClassName?: string; // defaults to object-cover
};

export default function LoadingImage({
  src,
  alt = "",
  className = "h-14 w-14 rounded-lg",
  imgClassName = "object-cover",
}: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // New picture or retry: start again
  useEffect(() => {
    setStatus("loading");
  }, [src, attempt]);

  // An image that's already cached can finish before React attaches onLoad
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setStatus("loaded");
  }, [src, attempt]);

  // Retry adds a throwaway query value so the browser tries the file again
  const finalSrc =
    attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden ${className}`}
      style={{ backgroundColor: SAND }}
    >
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`h-full w-full ${imgClassName}`}
        style={{ opacity: status === "loaded" ? 1 : 0, transition: "opacity 200ms" }}
        draggable={false}
      />

      {status === "loading" && (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center">
          <span className="text-[9px] font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>
            Loading…
          </span>
        </div>
      )}

      {status === "error" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAttempt((n) => n + 1);
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center"
        >
          <span className="text-[9px] font-semibold" style={{ color: ACCENT }}>
            Not loading
          </span>
          <span className="text-[9px] underline" style={{ color: "rgba(0,0,0,0.55)" }}>
            Tap to retry
          </span>
        </button>
      )}
    </div>
  );
}