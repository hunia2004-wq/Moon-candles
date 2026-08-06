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
        background: "linear-gradient(to bottom, #C77486 0%, #F4E1D2 40%, #F4E1D2 100%)",
      }}
    >
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-8 px-16">
        <RevealOnScroll>
          <div className="relative flex w-full items-start justify-between overflow-hidden pt-4 pb-2">
            <div
              className="absolute right-16 top-10 h-[300px] w-[300px] rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(circle, #C77486, transparent 70%)" }}
            />

            <div className="relative z-10 max-w-xs pt-8 text-left">
              <h1 className="text-4xl font-bold tracking-wide" style={{ color: "#5E3A4D" }}>
                Moon Candles
              </h1>
              <p className="mt-3 text-lg" style={{ color: "#5E3A4D" }}>
                Handmade, one flame at a time.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div style={{ overflow: "hidden", position: "relative" }}>
                <img
                  src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/lighter%20image.png"
                  alt="Lighter"
                  className="w-64 md:w-[420px]"
                  style={{ position: "relative", right: "84px", top: "-50px" }}
                />
              </div>
              <div
                className="w-6 blur-2xl opacity-70"
                style={{ height: "20px", background: "linear-gradient(to bottom, #F4C77A, transparent)" }}
              />
            </div>
          </div>
        </RevealOnScroll>

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