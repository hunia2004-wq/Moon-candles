"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";
type MenuProduct = {
   id: number | string;
  name: string;
  category: string;
};

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [products, setProducts] = useState<MenuProduct[]>([]);

useEffect(() => {
  if (!open) return;

  async function loadProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
            .select("id, name, category")
      .eq("is_active", true)
      .order("name");

    setProducts(data ?? []);
  }

  loadProducts();
}, [open]);

  const candleItems = products.filter((p) => p.category === "candle");
  const giveawayItems = products.filter((p) => p.category === "giveaway");

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

           {open && createPortal(
        <div className="fixed inset-0 z-[999] flex">
          {/* Panel — comes first now, so it renders on the left */}
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
                      style={{ color: "#D8A1AF" }}
                    >
                      Candles
                    </Link>
                    {candleItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.id}`}
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
                      style={{ color: "#6E86C7" }}
                    >
                      Giveaways
                    </Link>
                    {giveawayItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.id}`}
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
                Customize Your candle
              </Link>
              <Link
                href="/giveaways"
                onClick={closeAll}
                className="border-t py-3"
                style={{ borderColor: "#FFD6B8", color: "#000000" }}
              >
                Customize Your giveaways
              </Link>
              <Link
  href="/return-policy"
  onClick={closeAll}
  className="border-t py-3"
  style={{ borderColor: "#FFD6B8", color: "#000000" }}
>
  Return Policy
</Link>
            </nav>
          </div>

          {/* Backdrop — now after the panel, filling the remaining space to its right */}
                       <div
            className="flex-1 bg-black/30"
            onClick={closeAll}
            aria-hidden="true"
          />
        </div>,
        document.body
      )}
    </>
  );
}