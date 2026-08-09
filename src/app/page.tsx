import CandleCarousel from "./components/CandleCarousel";
import { createClient } from "@/lib/supabase/server";
import RevealOnScroll from "./components/RevealOnScroll";
import type { CarouselCandle } from "@/lib/supabase/types";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

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

        {/* Hero content — no explicit row height anymore. The row now
            sizes itself naturally to match its tallest child (the moon
            panel), so it's impossible for the row and its content to
            mismatch and leave empty striped space, which was the bug. */}
        <div
          className="relative z-10 flex flex-row items-center justify-center flex-nowrap"
          style={{
            gap: "0px",
            padding: "clamp(16px, 4vw, 64px)",
          }}
        >
          {/* Crescent moon panel — single source of truth for the row's
              height, since it's the tallest element. */}
          <div
  className="relative flex-shrink-0"
  style={{
    height: "clamp(240px, 60vw, 640px)",
    width: "auto",
    marginRight: "clamp(180px, 7vw, -100px)",
  }}
>
            <img
              src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20moon.png"
              alt=""
              style={{ height: "100%", width: "auto", display: "block" }}
            />

           {/* Centered text block */}
{/* "Moon Candles" — now first/top */}
<p
  className="font-bold"
  style={{
    position: "absolute",
    left: "1%",
    top: "30%",
    width: "48%",
    textAlign: "center",
    color: "#000000",
    fontSize: "clamp(17px, 2.2vw, 26px)",
    letterSpacing: "0.02em",
  }}
>
  Moon Candles
</p>

{/* "Light up your moon" — now second/below */}
<p
  className={`${caveat.className}`}
  style={{
    position: "absolute",
    left: "3%",
    top: "50%",
    width: "60%",
    textAlign: "left",
    color: "#DE4B33",
    fontSize: "13px",
    fontWeight: 1000,
  }}
>
  Light up your moon
</p>

{/* Button, positioned separately near the bottom of the crescent */}
<div
  className="absolute z-10 flex justify-center"
  style={{
    left: "11%",
    bottom: "31%",
    width: "40%",
  }}
>
 <button
  className="rounded-full font-medium transition-colors bg-[#DE4B33] hover:bg-[#b38691] active:bg-[#b38691]"
  style={{
    color: "#ffffff",
    fontSize: "clamp(10px, 1.5vw, 18px)",
    padding: "clamp(5px, 0.9vw, 11px) clamp(12px, 2.2vw, 28px)",
  }}
>
  Shop Now
</button>

            </div>
          </div>

          {/* Product photo — height locked to 100% of the row, which now
              always exactly matches the moon's real height. */}
         <div
  className="absolute flex items-center justify-center"
  style={{
    right: "clamp(-10px, 0vw, 70px)",
    top: "50%",
    transform: "translateY(-50%)",
    width: "clamp(200px, 68vw, 900px)",
    height: "clamp(250px, 70vw, 900px)",
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