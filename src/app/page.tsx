import CandleCarousel from "./components/CandleCarousel";
import { createClient } from "@/lib/supabase/server";
import RevealOnScroll from "./components/RevealOnScroll";
import LighterIcon from "./components/LighterIcon";

export default async function Home() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error.message);
  }

  return (
    <div
  className="flex flex-col flex-1 items-center justify-center font-sans"
  style={{
    background: "linear-gradient(to bottom, #C77486 0%, #F4E1D2 40%, #F4E1D2 100%)",
  }}
>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16" style={{ backgroundColor: "#F4E1D2" }}>

        <RevealOnScroll>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-24">
            {/* Warm glow, like the flame's light */}
            <div
              className="absolute h-[400px] w-[400px] rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(circle, #F4E1D2, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
             <LighterIcon />
              <h1
                className="mt-6 text-4xl font-bold tracking-wide"
                style={{ color: "#5E3A4D" }}
              >
                Moon Candles
              </h1>
              <p className="mt-3 max-w-md text-lg" style={{ color: "#5E3A4D" }}>
                Handmade, one flame at a time.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="w-full flex justify-center">
            <CandleCarousel candles={products ?? []} />
          </div>
        </RevealOnScroll>

        <div>
          <h2>footer</h2>
        </div>
      </main>
    </div>
  );
}