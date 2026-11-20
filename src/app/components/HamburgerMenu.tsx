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

type MenuCategory = {
  slug: string;
  name: string;
  accent: string | null;
};
// Heading color per category. Categories not listed here use the default.
// Heading color comes from each category's accent in the database.
// This is only used if a category has no accent set.
const DEFAULT_CATEGORY_COLOR = "#657A55";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    if (!open) return;

    async function loadMenu() {
      const supabase = createClient();

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, category")
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("categories")
                   .select("slug, name, accent")
          .eq("is_visible", true)
          .order("sort_order", { ascending: true }),
      ]);

      setProducts(productsRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
    }

    loadMenu();
  }, [open]);

  

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
                    {categories.map((cat, index) => {
                      const items = products.filter((p) => p.category === cat.slug);
                      if (items.length === 0) return null;

                      return (
                        <div key={cat.slug} className="flex flex-col gap-1">
                          <Link
                            href={`/shop?category=${cat.slug}`}
                            onClick={closeAll}
                            className={`mb-2 block text-sm font-bold uppercase tracking-wide ${
                              index === 0 ? "mt-1" : "mt-4"
                            }`}
                            style={{
                              color: cat.accent ?? DEFAULT_CATEGORY_COLOR,
                            }}
                          >
                            {cat.name}
                          </Link>
                          {items.map((item) => (
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
                      );
                    })}
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