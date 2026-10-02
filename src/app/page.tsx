import CandleCarousel from "./components/CandleCarousel";
import { createClient } from "@/lib/supabase/server";
import RevealOnScroll from "./components/RevealOnScroll";
import type { CarouselCandle } from "@/lib/supabase/types";
import { Caveat, Cormorant_Garamond } from "next/font/google";
import CustomizationTeaser from "./components/CustomizationTeaser";
import Link from "next/link";
import OurCollection from "./components/OurCollection";
import Testimonials from "./components/Testimonials";
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
const cormorant = Cormorant_Garamond({

  subsets: ["latin"],

  weight: ["500", "600"],

  style: ["italic"],

});
const STRIPE_COUNT = 21;

const FULL_HERO_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section/full%20hero.png";

export default async function Home() {
  const supabase = await createClient();

  const { data: marble, error } = await supabase
    .from("products")
    .select("*")
    .eq("name", "Iced Latte")
    .single();

  if (error) {
    console.error("Failed to fetch Iced Latte:", error.message);
  }
  const { data: collectionProducts, error: collectionError } =
  await supabase
    .from("products")
    .select("*")
    .limit(3);

if (collectionError) {
  console.error(
    "Failed to fetch collection:",
    collectionError.message
  );
}

  const candles: CarouselCandle[] =
 marble?.colors?.map(
  (color: {
    name: string;
    hex: string | null;
    image_url?: string;
    image_urls?: string[];
  }) => ({
    productId: marble.id,
    colorName: color.name,
    name: color.name,
    description: marble.description,
    price: marble.price,
    size_ml: marble.size_ml,
    scents: marble.scents,
    image: color.image_urls?.[0] ?? color.image_url ?? null,
  })
) ?? [];

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center font-sans"
      style={{ backgroundColor: "#efe3c4" }}
    >
                     <div className="relative w-full overflow-hidden md:min-h-[680px]" style={{ paddingBottom: "40px" }}>
  {/* STRIPES — fixed height, independent of the outer container's size */}
  <div className="absolute left-0 right-0 top-0 flex h-[450px] md:h-[680px]">
    {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
      <div
        key={i}
        className="flex-1"
        style={{
          backgroundColor: i % 2 === 0 ? "#8FAA82" : "#efe3c4",
        }}
      />
    ))}
  </div>

  {/* ================= MOBILE HERO — FLOOR SCENE ================= */}
  <div
    className="relative z-10 flex md:hidden"
    style={{
      width: "100%",
      height: "330px",
      overflow: "hidden",
    }}
  >
    {/* MULTIPLE LEAF SHADOWS */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: "-35px",
        right: "-35px",
        width: "260px",
height: "260px",
        zIndex: 1,
        opacity: 0.3,
        filter: "blur(5px)",
      }}
    >
      <div style={{ position: "absolute", width: "48px", height: "120px", right: "45px", top: "-20px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(25deg)" }} />
      <div style={{ position: "absolute", width: "42px", height: "105px", right: "95px", top: "5px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(55deg)" }} />
      <div style={{ position: "absolute", width: "55px", height: "130px", right: "5px", top: "30px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(5deg)" }} />
      <div style={{ position: "absolute", width: "38px", height: "95px", right: "135px", top: "45px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(75deg)" }} />
      <div style={{ position: "absolute", width: "46px", height: "115px", right: "65px", top: "80px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(35deg)" }} />
      <div style={{ position: "absolute", width: "35px", height: "90px", right: "145px", top: "105px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(65deg)" }} />
      <div style={{ position: "absolute", width: "52px", height: "125px", right: "-10px", top: "105px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(-10deg)" }} />
      <div style={{ position: "absolute", width: "32px", height: "80px", right: "105px", top: "145px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(45deg)" }} />
    </div>

    {/* FLOOR */}
    <div
      className="absolute"
      style={{ left: 0, right: 0, bottom: 0, height: "40px", background: "#efe3c4", zIndex: 1 }}
    />

    {/* COMBINED CONTACT SHADOW */}
    <div
      className="absolute"
      style={{
        width: "320px",
        height: "24px",
        left: "50%",
        bottom: "20px",
        transform: "translateX(-50%)",
        background:
          "radial-gradient(ellipse at center, rgba(55, 48, 35, 0.42) 0%, rgba(55, 48, 35, 0.30) 35%, rgba(55, 48, 35, 0.15) 60%, rgba(55, 48, 35, 0) 85%)",
        filter: "blur(5px)",
        borderRadius: "50%",
        zIndex: 2,
      }}
    />

    {/* FULL HERO IMAGE — moon + candles combined into one asset */}
    <img
      src={FULL_HERO_IMG}
      alt="Moon Candles collection"
      style={{
        position: "absolute",
        width: "340px",
        height: "auto",
        left: "50%",
        bottom: "0px",
        transform: "translateX(-50%)",
        objectFit: "contain",
        display: "block",
        zIndex: 3,
        filter: "none",
      }}
    />
  </div>

   {/* ================= DESKTOP HERO ================= */}
    <div
           className="hidden md:flex relative z-10 items-end justify-center max-w-6xl mx-auto px-12"
    style={{ paddingTop: "190px", paddingBottom: "0px", transform: "translateY(50px)" }}
  >
        {/* COMBINED CONTACT SHADOW — desktop */}
    <div
      className="absolute pointer-events-none"
      style={{
        width: "480px",
        height: "32px",
        left: "50%",
        bottom: "-30px",
        transform: "translateX(-50%)",
        background:
          "radial-gradient(ellipse at center, rgba(55, 48, 35, 0.42) 0%, rgba(55, 48, 35, 0.30) 35%, rgba(55, 48, 35, 0.15) 60%, rgba(55, 48, 35, 0) 85%)",
        filter: "blur(7px)",
        borderRadius: "50%",
        zIndex: 2,
      }}
    />
    {/* MULTIPLE LEAF SHADOWS — scaled up for desktop */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: "-30px",
        right: "calc(0% - 300px)",
        width: "300px",
        height: "360px",
        zIndex: 1,
        opacity: 0.3,
        filter: "blur(6px)",
      }}
    >
      <div style={{ position: "absolute", width: "67px", height: "168px", right: "63px", top: "-28px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(25deg)" }} />
      <div style={{ position: "absolute", width: "59px", height: "147px", right: "133px", top: "7px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(55deg)" }} />
      <div style={{ position: "absolute", width: "77px", height: "182px", right: "7px", top: "42px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(5deg)" }} />
      <div style={{ position: "absolute", width: "53px", height: "133px", right: "189px", top: "63px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(75deg)" }} />
      <div style={{ position: "absolute", width: "64px", height: "161px", right: "91px", top: "112px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(35deg)" }} />
      <div style={{ position: "absolute", width: "49px", height: "126px", right: "203px", top: "147px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(65deg)" }} />
      <div style={{ position: "absolute", width: "73px", height: "175px", right: "-14px", top: "147px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(-10deg)" }} />
      <div style={{ position: "absolute", width: "45px", height: "112px", right: "147px", top: "203px", background: "#46553D", borderRadius: "100% 0 100% 0", transform: "rotate(45deg)" }} />
    </div>

    <img
      src={FULL_HERO_IMG}
      alt="Moon Candles collection"
      style={{
        position: "relative",
        zIndex: 3,
        height: "500px",
        width: "auto",
        display: "block",
      }}
    />
  </div>
</div>

      {/* ================= SHOP NOW BUTTON ================= */}
      {/* This is now BELOW the entire stripes + moon + candles hero */}
      <div
        className="flex w-full justify-center"
        style={{
          backgroundColor: "#efe3c4",
          paddingTop: "18px",
          paddingBottom: "8px",
        }}
      >
        <Link
          href="/shop"
          className="inline-flex items-center justify-center transition-colors bg-[#47684b] hover:bg-[#7C966F] active:bg-[#7C966F]"
          style={{
            color: "#ffffff",
            fontSize: "14px",
            padding: "9px 18px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          Shop Now
        </Link>
      </div>

      {/* ================= MOBILE TEXT SECTION ================= */}
      <div
        className="md:hidden flex flex-col items-center text-center w-full"
        style={{
          backgroundColor: "#efe3c4",
          paddingTop: "55px",
          paddingBottom: "35px",
        }}
      >
  <h1
  style={{
    color: "#657A55",
    fontFamily: "Georgia, serif",
    fontSize: "27px",
    fontWeight: 500,
    margin: -10,
    marginTop: -40,
    lineHeight: 1.1,
  }}
>
  Light up your{" "}
  <span
    style={{
      fontFamily: "Georgia, serif",
      fontSize: "27px",
      fontWeight: 500,
      fontStyle: "italic",
      letterSpacing: "0.02em",
    }}
  >
    Moon
  </span>
</h1>

        <p
          style={{
            color: "#7D806C",
            fontSize: "16px",
            lineHeight: "1.35",
            margin: "8px 0 14px",
          }}
        >
          Handcrafted scented candles made to
          <br />
          brighten your space.
        </p>

                <span
          style={{
            color: "#7A9567",
            fontSize: "28px",
            lineHeight: 1,
          }}
        >
          ☾
        </span>
      </div>

      {/* ================= DESKTOP TEXT SECTION ================= */}
      <div
        className="hidden md:flex flex-col items-center text-center w-full"
        style={{
          backgroundColor: "#efe3c4",
          paddingTop: "10px",
          paddingBottom: "40px",
        }}
      >
        <h1
          style={{
            color: "#657A55",
            fontFamily: "Georgia, serif",
            fontSize: "44px",
            fontWeight: 500,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Light up your{" "}
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "44px",
              fontWeight: 500,
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            Moon
          </span>
        </h1>

        <p
          style={{
            color: "#7D806C",
            fontSize: "18px",
            lineHeight: "1.4",
            margin: "14px 0 18px",
          }}
        >
          Handcrafted scented candles made to brighten your space.
        </p>

        <span
          style={{
            color: "#7A9567",
            fontSize: "32px",
            lineHeight: 1,
          }}
        >
          ☾
        </span>
      </div>

      {/* ================= MAIN CONTENT ================= */}
 <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-4 px-4 md:py-8 md:px-16">
  <RevealOnScroll>
    <div className="w-full flex flex-col items-center">
      <p
        className="uppercase tracking-[0.20em] text-xs md:text-sm mb-1"
        style={{ color: "#000000" }}
      >
        fan favorites
      </p>

      <h2
        className="font-serif text-3xl md:text-5xl font-bold text-center"
        style={{ color: "#000000" }}
      >
        Best Sellers
       
      </h2>

      <CandleCarousel candles={candles} />
    </div>
  </RevealOnScroll>

    {/* OUR COLLECTION */}
  <OurCollection />

  

  <CustomizationTeaser />
  <Testimonials />
</main>
    </div>
  );
}