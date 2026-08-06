"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";

const SHOP_ITEMS = [
  { name: "Marble Moon Candle", slug: "marble-moon-candle" },
  { name: "Dimple Moon Candle", slug: "dimple-moon-candle" },
  { name: "Iced Latte Candle", slug: "iced-latte-candle" },
  { name: "Molten Muse", slug: "molten-muse" },
  { name: "Crystal Glow Candle", slug: "crystal-glow" },
  { name: "Melt Balm Candle", slug: "melt-balm" },
  { name: "Shell Candle", slug: "shell" },
];

const GIVEAWAY_ITEMS = [
  { name: "Bloom Wand", slug: "bloom-wand" },
  { name: "Tambourines", slug: "tambourines" },
  { name: "Mini Candles", slug: "mini-candles" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [giveawaysOpen, setGiveawaysOpen] = useState(false);

  function closeAll() {
    setOpen(false);
    setShopOpen(false);
    setGiveawaysOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{ color: "#5e3a4d" }}
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
            style={{ backgroundColor: "#F4E1D2" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-lg font-semibold tracking-wide"
                style={{ color: "#5e3a4d" }}
              >
                Moon Candles
              </p>
              <button onClick={closeAll} aria-label="Close menu">
                <X size={24} style={{ color: "#5e3a4d" }} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1 text-base font-medium uppercase tracking-wide">
              <Link
                href="/"
                onClick={closeAll}
                className="py-3"
                style={{ color: "#5e3a4d" }}
              >
                Home
              </Link>

              {/* Shop All */}
              <div className="border-t" style={{ borderColor: "#c77486" }}>
                <div className="flex items-center justify-between py-3">
                  <Link
                    href="/shop"
                    onClick={closeAll}
                    style={{ color: "#5e3a4d" }}
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
                        color: "#5e3a4d",
                        transform: shopOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {shopOpen && (
                  <div className="flex flex-col gap-1 pb-3 pl-4 text-sm normal-case tracking-normal">
                    {SHOP_ITEMS.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/product/by-name/${encodeURIComponent(item.name)}`}
                        onClick={closeAll}
                        className="py-1.5"
                        style={{ color: "#5e3a4d", opacity: 0.85 }}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Giveaways */}
              <div className="border-t" style={{ borderColor: "#c77486" }}>
                <div className="flex items-center justify-between py-3">
                  <span style={{ color: "#5e3a4d" }}>Giveaways</span>
                  <button
                    onClick={() => setGiveawaysOpen((prev) => !prev)}
                    aria-label="Toggle giveaways"
                  >
                    <ChevronDown
                      size={18}
                      style={{
                        color: "#5e3a4d",
                        transform: giveawaysOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </div>

                {giveawaysOpen && (
                  <div className="flex flex-col gap-1 pb-3 pl-4 text-sm normal-case tracking-normal">
                    {GIVEAWAY_ITEMS.map((item) => (
                      <span
                        key={item.slug}
                        className="py-1.5"
                        style={{ color: "#5e3a4d", opacity: 0.85 }}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="border-t py-3"
                style={{ borderColor: "#c77486", color: "#5e3a4d" }}
              >
                Customize Your Own
              </div>

              <Link
                href="/about"
                onClick={closeAll}
                className="border-t py-3"
                style={{ borderColor: "#c77486", color: "#5e3a4d" }}
              >
                About Us
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
