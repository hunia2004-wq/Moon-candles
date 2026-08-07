import CandleCarousel from "./components/CandleCarousel";
import { createClient } from "@/lib/supabase/server";
import RevealOnScroll from "./components/RevealOnScroll";
import type { CarouselCandle } from "@/lib/supabase/types";

export default async function Home() {
  const supabase = await createClient();
  const { data: marble, error } = await supabase
    .from("products")
    .select("*")
    .eq("name", "Marble Moon Candle")
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
        background: "linear-gradient(to bottom, #FF5A36 0%, #FFF4E6 40%, #FFF4E6 100%)",
      }}
    >
      <RevealOnScroll>
  <div
   className="relative left-1/2 right-1/2 -mx-[50vw] w-screen flex items-center justify-center overflow-hidden px-6 py-10 md:py-16"
   style={{
  backgroundImage:
    "repeating-linear-gradient(90deg, #FF6B3D 0%, #FF6B3D 50%, #F56CB3 50%, #F56CB3 100%)",
  backgroundSize: "5% 100%",
}}
  >
    <div className="relative flex w-full max-w-2xl items-center justify-center">
      <div style={{ overflow: "hidden", position: "relative" }}>
        <img
          src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/lighter%20image.png"
          alt="Lighter"
          className="w-24 md:w-40"
        />
      </div>
      <div
        className="w-3 blur-2xl opacity-70 md:w-4"
        style={{ height: "16px", background: "linear-gradient(to bottom, #F97FB8, transparent)" }}
      />
    </div>
  </div>
</RevealOnScroll>

      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-4 px-4 md:py-8 md:px-16">
        <RevealOnScroll>
          <div className="w-full flex justify-center">
            <CandleCarousel candles={candles} />
          </div>
        </RevealOnScroll>

        <div>
          <h2>footer</h2>
        </div>
      </main>
    </div>
  );
}