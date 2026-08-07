"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 md:py-5 transition-all duration-300"
      style={{
        backgroundImage: scrolled
          ? "none"
          : "repeating-linear-gradient(90deg, #FF6B3D 0%, #FF6B3D 50%, #F56CB3 50%, #F56CB3 100%)",
        backgroundSize: "5% 100%",
        backgroundColor: "#FFF4E6",
      }}
    >
      <HamburgerMenu />
      <p
        className="text-base font-bold tracking-wide md:text-xl"
        style={{ color: "#000000" }}
      >
        Moon Candles
      </p>
      <Link href="/cart" aria-label="Cart">
        <ShoppingCart size={20} style={{ color: "#000000" }} />
      </Link>
    </header>
  );
}
