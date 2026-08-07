"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 h-20 md:h-24 relative overflow-visible"
      style={{ backgroundColor: "#EFE3C4" }}
    >
      <HamburgerMenu />
      <Link
        href="/"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10"
      >
        <img
          src="https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/logo.png"
          alt="Moon Candles"
          className="h-32 w-auto md:h-70"
        />
      </Link>
      <Link href="/cart" aria-label="Cart">
        <ShoppingCart size={20} style={{ color: "#000000" }} />
      </Link>
    </header>
  );
}
