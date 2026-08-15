"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";

const SHOP_ITEMS = [
  { name: "Marble Moon", slug: "marble-moon-candle" },
  { name: "Dimple Moon", slug: "dimple-moon-candle" },
  { name: "Iced Latte", slug: "iced-latte-candle" },
  { name: "Molten Muse", slug: "molten-muse" },
  { name: "Crystal Glow", slug: "TEST-CRYSTAL" },
  { name: "Melt Balm", slug: "melt-balm" },
  { name: "Shell", slug: "shell" },
];

const GIVEAWAY_ITEMS = [
  { name: "Mini Candles", slug: "mini-candles" },
  { name: "Quack and Kiss", slug: "quack-and-kiss" },
  { name: "Plain tambourine", slug: "plain-tambourine" },
  { name: "Fan", slug: "fan" },
 { name: "Bloom Wand", slug: "bloom-wand" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  function closeAll() {
    setOpen(false);
    setShopOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{ color: "#000000" }}
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[999] flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/30"
            onClick={closeAll}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto px-6 py-6"
            style={{ backgroundColor: "#FFF4E6" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-lg font-bold tracking-wide"
                style={{ color: "#000000" }}
              >
                Moon Candles
              </p>
              <button onClick={closeAll} aria-label="Close menu">
                <X size={24} style={{ color: "#000000" }} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1 text-base font-medium uppercase tracking-wide">
              <Link
                href="/"
                onClick={closeAll}
                className="py-3"
                style={{ color: "#000000" }}
              >
                Home
              </Link>

              {/* Shop All — single dropdown covering candles + giveaways */}
              <div className="border-t" style={{ borderColor: "#FFD6B8" }}>
                <div className="flex items-center justify-between py-3">
                  <Link
                    href="/shop"
                    onClick={closeAll}
                    style={{ color: "#000000" }}
                  >
                    Shop All
                  </Link>
                  <button
                    onClick={() => setShopOpen((prev) => !prev)}
                    aria-label="Toggle shop categories"
                  >
                    <ChevronDown
                      size={18}
                      style={{
                        color: "#000000",
                        transform: shopOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {shopOpen && (
                  <div className="flex flex-col gap-1 pb-3 pl-4 text-sm normal-case tracking-normal">
                    {/* Candles group */}
                   <Link
  href="/shop?category=candles"
  onClick={closeAll}
  className="mt-1 mb-2 block text-sm font-bold uppercase tracking-wide"
  style={{ color: "#DE4B33" }}
>
  Candles
</Link>
               {SHOP_ITEMS.map((item) => (
  <Link
    key={item.slug}
    href={`/product/by-name/${encodeURIComponent(item.name)}`}
    onClick={closeAll}
    className="py-1.5"
    style={{ color: "#000000" }}
  >
    {item.name}
  </Link>
))}

                    {/* Giveaways group */}
         <Link
  href="/shop?category=giveaways"
  onClick={closeAll}
  className="mt-4 mb-2 block text-sm font-bold uppercase tracking-wide"
  style={{ color: "#DE4B33" }}
>
  Giveaways
</Link>
                {GIVEAWAY_ITEMS.map((item) => (
  <Link
    key={item.slug}
    href={`/product/by-name/${encodeURIComponent(item.name)}`}
    onClick={closeAll}
    className="py-1.5"
    style={{ color: "#000000" }}
  >
    {item.name}
  </Link>
))}
                  </div>
                )}
              </div>

              <Link
                href="/customize"
                onClick={closeAll}
                className="border-t py-3"
                style={{ borderColor: "#FFD6B8", color: "#000000" }}
              >
                Customize Your Own
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}