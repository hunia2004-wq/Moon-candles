"use client";

import Link from "next/link";

const CANDLES_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section/candless%20hero.png";

const MOON_IMG =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/hero%20section/moon%20hero.png";

export default function OurCollection() {
  return (
    <section
      className="w-full"
      style={{
        backgroundColor: "#8FAA82",
        padding: "65px 5%",
      }}
    >
      {/* HEADER */}

      <div
        className="flex flex-col items-center text-center"
        style={{ marginBottom: "35px" }}
      >
        <p
          style={{
            color: "#efe3c4",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            margin: "0 0 9px",
          }}
        >
          explore the moon
        </p>

        <h2
          style={{
            color: "#000000",
            fontFamily: "Georgia, serif",
            fontSize: "clamp(32px, 4vw, 46px)",
            fontWeight: 500,
            lineHeight: 1,
            margin: 0,
          }}
        >
          Our Collection
        </h2>
      </div>

      {/* ================= CARDS ================= */}

      <div
        className="mx-auto flex w-full max-w-7xl flex-col gap-5 md:flex-row"
      >
        {/* ================= CANDLES ================= */}

        <div
          className="group relative flex min-h-[260px] flex-1 overflow-hidden"
          style={{
            backgroundColor: "#efe3c4",
            borderRadius: "18px",
          }}
        >
          {/* IMAGE SIDE */}

          <div
            className="relative flex w-[47%] items-center justify-center"
            style={{
              overflow: "hidden",
            }}
          >
            <img
              src={CANDLES_IMG}
              alt="Shop our candles"
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              style={{
                padding: "12px",
              }}
            />

            {/* subtle circle */}
            <div
              className="pointer-events-none absolute"
              style={{
                width: "155px",
                height: "155px",
                borderRadius: "50%",
                border: "1px solid rgba(71,104,75,0.18)",
              }}
            />
          </div>

          {/* TEXT SIDE */}

          <div
            className="flex w-[53%] flex-col justify-center"
            style={{
              padding: "30px 28px 30px 5px",
            }}
          >
            <span
              style={{
                color: "#7A9567",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "9px",
              }}
            >
              hand poured
            </span>

            <h3
              style={{
                color: "#000000",
                fontFamily: "Georgia, serif",
                fontSize: "clamp(25px, 3vw, 37px)",
                fontWeight: 500,
                lineHeight: 0.98,
                margin: "0 0 12px",
              }}
            >
              Shop Our
              <br />
              Candles
            </h3>

            <p
              style={{
                color: "#6f7565",
                fontSize: "12px",
                lineHeight: 1.5,
                margin: "0 0 20px",
                maxWidth: "190px",
              }}
            >
              Discover scents made to light up your Moon.
            </p>

            <Link
              href="/shop"
              className="w-fit transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: "#47684b",
                color: "#ffffff",
                fontSize: "11px",
                letterSpacing: "0.04em",
                padding: "9px 16px",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              Shop Candles
            </Link>
          </div>
        </div>

        {/* ================= GIVEAWAYS ================= */}

        <div
          className="group relative flex min-h-[260px] flex-1 overflow-hidden"
          style={{
            backgroundColor: "#efe3c4",
            borderRadius: "18px",
          }}
        >
          {/* IMAGE SIDE */}

          <div
            className="relative flex w-[47%] items-center justify-center"
            style={{
              overflow: "hidden",
            }}
          >
            <img
              src={MOON_IMG}
              alt="Shop our giveaways"
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              style={{
                padding: "18px",
              }}
            />

            <div
              className="pointer-events-none absolute"
              style={{
                width: "155px",
                height: "155px",
                borderRadius: "50%",
                border: "1px solid rgba(71,104,75,0.18)",
              }}
            />
          </div>

          {/* TEXT SIDE */}

          <div
            className="flex w-[53%] flex-col justify-center"
            style={{
              padding: "30px 28px 30px 5px",
            }}
          >
            <span
              style={{
                color: "#7A9567",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: "9px",
              }}
            >
              little surprises
            </span>

            <h3
              style={{
                color: "#000000",
                fontFamily: "Georgia, serif",
                fontSize: "clamp(25px, 3vw, 37px)",
                fontWeight: 500,
                lineHeight: 0.98,
                margin: "0 0 12px",
              }}
            >
              Shop Our
              <br />
              Giveaways
            </h3>

            <p
              style={{
                color: "#6f7565",
                fontSize: "12px",
                lineHeight: 1.5,
                margin: "0 0 20px",
                maxWidth: "190px",
              }}
            >
              Little Moon treasures made to make you smile.
            </p>

            <Link
              href="/shop?category=giveaways"
              className="w-fit transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: "#47684b",
                color: "#ffffff",
                fontSize: "11px",
                letterSpacing: "0.04em",
                padding: "9px 16px",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              Shop Giveaways
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}