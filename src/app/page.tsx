import CandleCarousel from "./components/CandleCarousel";
import { createClient } from "@/lib/supabase/server";
import RevealOnScroll from "./components/RevealOnScroll";
import type { CarouselCandle } from "@/lib/supabase/types";

const STRIPE_COUNT = 21;

export default async function Home() {
  const supabase = await createClient();
  const { data: marble, error } = await supabase
    .from("products")
    .select("*")
    .eq("name", "Marble Moon")
    .single();

  if (error) {
    console.error("Failed to fetch Marble Moon Candle:", error.message);
  }

  const candles: CarouselCandle[] =
   marble?.colors?.map((color: { name: string; hex: string | null; image_url?: string }) => ({
      productId: marble.id,
      colorName: color.name,
      name: marble.name,
      description: marble.description,
      price: marble.price,
      size_ml: marble.size_ml,
      scents: marble.scents,
      image: color.image_url ?? null,
    })) ?? [];

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center font-sans"
      style={{
        backgroundColor: "#FFF4E6",
      }}
    >
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 flex">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: i % 2 === 0 ? "#DE4B33" : "#EFE3C4",
              }}
            />
          ))}
        </div>

        {/* Hero content — fluid-responsive using clamp() so sizes scale
            smoothly with the viewport instead of jumping at fixed
            breakpoints. Row height itself scales with viewport width. */}
        <div
          className="relative z-10 flex flex-row items-center justify-center flex-nowrap"
          style={{
            gap: "0px",
            padding: "clamp(16px, 4vw, 64px)",
            height: "clamp(480px, 100vw, 1500px)",
          }}
        >
          {/* Crescent moon panel */}
          <div
  className="relative flex-shrink-0"
  style={{
    height: "clamp(240px, 45vw, 2000px)",
    width: "auto",
    aspectRatio: "auto",
  }}
>
  <img
    src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20moon.png"
    alt=""
    style={{ height: "100%", width: "auto", display: "block" }}
  />

   <div
  className="absolute z-10 flex flex-col items-center text-center"
  style={{
    left: "9%",
    top: "50%",
    width: "40%",
    transform: "translateY(-50%)",
  }}
>
              <p
                className="uppercase font-medium"
                style={{
                  color: "#DE4B33",
                  fontSize: "clamp(10px, 0.7vw, 8px)",
                  letterSpacing: "0em",
                }}
              >
                Handpoured With Love
              </p>
              <h1
                className="font-bold leading-tight"
                style={{
                  color: "#000000",
                  fontSize: "clamp(16px, 3vw, 30px)",
                  marginTop: "clamp(4px, 1vw, 12px)",
                }}
              >
                Light Your Moon
              </h1>
              <p
                className="leading-relaxed"
                style={{
                  color: "#000000",
                  opacity: 0.7,
                  fontSize: "clamp(9px, 1vw, 10px)",
                  marginTop: "clamp(4px, 1.5vw, 16px)",
                }}
              >
                Scented candles that turn ordinary moments into magic.
              </p>
              <button
                className="rounded-full font-medium"
                style={{
                  backgroundColor: "#6E86C7",
                  color: "#FFFFFF",
                  fontSize: "clamp(9px, 1.2vw, 16px)",
                  padding: "clamp(6px, 1vw, 12px) clamp(14px, 2.5vw, 32px)",
                  marginTop: "clamp(6px, 1.5vw, 24px)",
                }}
              >
                Shop Now
              </button>
            </div>
          </div>

          {/* Product photo */}
     <div
  className="relative flex items-end justify-center flex-shrink-0"
  style={{
    width: "clamp(300px, 200vw, 1500px)",
    height: "100%",
  
  }}
>
            <img
  src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/candles%20hero.png"
  alt="Moon Candles collection"
  className="h-full w-full object-contain"
/>
          </div>
        </div>
      </div>

      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-4 px-4 md:py-8 md:px-16">
        <RevealOnScroll>
          <div className="w-full flex justify-center">
            <CandleCarousel candles={candles} />
          </div>
        </RevealOnScroll>

        <div>
          <h2 className="font-bold" style={{ color: "#000000" }}>footer</h2>
        </div>
      </main>
    </div>
  );
}