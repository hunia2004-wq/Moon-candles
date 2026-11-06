"use client";

import { LOGO_URL, LOGO_SIZE } from "@/lib/brand";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";
import CartDrawer from "./CartDrawer";
import ConditionalPromoBanner from "./ConditionalPromoBanner";
import { getCart, cartCount } from "@/lib/cart";

export default function Header() {
  const [count, setCount] = useState(0);
  const chromeRef = useRef<HTMLDivElement>(null);

  // Publishes the real height of banner + header as --header-h, so
  // anything fixed below the header (like the back arrow) can follow it.
  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCount(cartCount(getCart()));

    function handleCartUpdated() {
      setCount(cartCount(getCart()));
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === "cart") {
        setCount(cartCount(getCart()));
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div ref={chromeRef} className="sticky top-0 z-50">
      <ConditionalPromoBanner />

      <header
        className="relative flex h-20 items-center justify-between px-4 md:h-24"
        style={{ backgroundColor: "#efe3c4" }}
      >
        <HamburgerMenu />

        <Link
          href="/"
          aria-label="Moon Candles home"
          className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center"
        >
          <img
            src={LOGO_URL}
            alt="Moon Candles"
            className={LOGO_SIZE.header}
          />
        </Link>

        <Link href="/cart" aria-label="Cart" className="relative">
          <ShoppingCart size={20} style={{ color: "#000000" }} />

          {count > 0 && (
            <span
              className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
            >
              {count}
            </span>
          )}
        </Link>

        <CartDrawer />
      </header>
    </div>
  );
}