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
      <div className="relative w-full min-h-[70vh] md:min-h-[85vh] flex overflow-hidden">
        {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              backgroundColor: i % 2 === 0 ? "#DE4B33" : "#EFE3C4",
            }}
          />
        ))}

        {/* Hero content overlay — arch panel + staggered products.
            Placeholder copy/images for now, swap in real content later. */}
        <div className="absolute inset-0 z-10 flex flex-col md:flex-row items-center justify-center gap-8 px-6 py-10 md:px-16">
          {/* Left: cream arch panel */}
          <div
            className="relative w-full max-w-md min-h-[520px] md:min-h-[640px] rounded-[999px_999px_24px_24px] px-8 pt-16 pb-12 md:pt-24 md:pb-16 text-center md:text-left flex flex-col justify-center ml-4 md:ml-8"
            style={{ backgroundColor: "#FFF4E6", border: "1px solid #DE4B33" }}
          >
            <p
              className="text-xs uppercase tracking-[0.2em] font-medium"
              style={{ color: "#DE4B33" }}
            >
              Handpoured With Love
            </p>
            <h1
              className="mt-3 text-4xl md:text-5xl font-bold leading-tight"
              style={{ color: "#000000" }}
            >
              Light Your Moon
            </h1>
            <p
              className="mt-4 text-sm md:text-base leading-relaxed"
              style={{ color: "#000000", opacity: 0.7 }}
            >
              Scented candles that turn ordinary moments into magic.
            </p>
            <button
              className="mt-6 rounded-full px-8 py-3 font-medium"
              style={{ backgroundColor: "#6E86C7", color: "#FFFFFF" }}
            >
              Shop Now
            </button>
          </div>

          {/* Right: single composited product image (real candles on real
              stone pedestals), matching the reference photo directly. */}
          <div className="relative w-full max-w-3xl flex items-end justify-end ml-auto">
            <img
              src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section%20img.png"
              alt="Moon Candles collection"
              className="w-full h-auto object-contain"
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
