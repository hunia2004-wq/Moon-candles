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
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-4 px-4 md:py-8 md:px-16">
  <RevealOnScroll>
    <div className="relative flex w-full flex-col items-center overflow-hidden pt-4 pb-2 md:flex-row md:items-start md:justify-between">
      <div
        className="absolute right-4 top-6 h-[180px] w-[180px] rounded-full opacity-50 blur-3xl md:right-16 md:top-10 md:h-[300px] md:w-[300px]"
        style={{ background: "radial-gradient(circle, #C77486, transparent 70%)" }}
      />

      <div className="relative z-10 order-2 max-w-xs pt-4 text-center md:order-1 md:pt-8 md:text-left">
        <h1 className="text-2xl font-bold tracking-wide md:text-4xl" style={{ color: "#5E3A4D" }}>
          Moon Candles
        </h1>
        <p className="mt-2 text-sm md:mt-3 md:text-lg" style={{ color: "#5E3A4D" }}>
          Handmade, one flame at a time.
        </p>
      </div>

      <div className="relative z-10 order-1 flex flex-col items-center md:order-2">
        <div style={{ overflow: "hidden", position: "relative" }}>
          <img
            src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/lighter%20image.png"
            alt="Lighter"
            className="w-32 md:w-64 lg:w-[420px]"
            style={{ position: "relative", right: "0px", top: "0px" }}
          />
        </div>
        <div
          className="w-4 blur-2xl opacity-70 md:w-6"
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