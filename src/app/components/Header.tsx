"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 flex h-20 items-center justify-between px-4 md:h-24"
      style={{ backgroundColor: "#efe3c4" }}
    >
      <HamburgerMenu />

      <Link
        href="/"
        aria-label="Moon Candles home"
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center"
      >
        <img
          src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/moon%20logo/logo.png"
          alt="Moon Candles"
          className="h-28 w-auto md:h-36"
        />
      </Link>

      <Link href="/cart" aria-label="Cart">
        <ShoppingCart size={20} style={{ color: "#000000" }} />
      </Link>
    </header>
  );
}