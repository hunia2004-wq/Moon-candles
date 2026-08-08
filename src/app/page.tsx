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
        {/* Stripes now fill whatever height the content below ends up
            being, instead of the content being clipped to a fixed
            container height (which was cutting the photo off on mobile). */}
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

        {/* Hero content — now in normal flow, so it actually determines
            the section's height on mobile instead of being clipped. */}
       <div className="relative z-10 flex flex-row items-center justify-center gap-2 px-3 py-6 md:gap-8 md:px-16 md:py-10">
          {/* Cream arch panel */}
         <div
  className="relative w-[25%] max-w-sm md:max-w-md min-h-[200px] md:min-h-[640px] rounded-[999px_999px_24px_24px] px-2 pt-4 pb-3 md:px-8 md:pt-24 md:pb-16 text-center md:text-left flex flex-col justify-center md:ml-8"
  style={{ backgroundColor: "#FFF4E6", border: "1px solid #DE4B33" }}
>
            <p
              className="text-xs uppercase tracking-[0.2em] font-medium"
              style={{ color: "#DE4B33" }}
            >
              Handpoured With Love
            </p>
            <h1
  className="mt-2 text-lg md:text-5xl font-bold leading-tight"
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
              className="mt-6 self-center md:self-start rounded-full px-8 py-3 font-medium"
              style={{ backgroundColor: "#6E86C7", color: "#FFFFFF" }}
            >
              Shop Now
            </button>
          </div>

          {/* Product photo — full width on mobile, capped width on desktop */}
        <div className="relative w-[75%] max-w-xs md:max-w-3xl h-[440px] md:h-auto flex items-end justify-center md:justify-end md:ml-auto">
  <img
    src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section%20img.png"
    alt="Moon Candles collection"
    className="h-full w-auto md:w-full md:h-auto object-contain"
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