import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HamburgerMenu from "./components/HamburgerMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moon Candles",
  description: "Handmade candles from Moon Candles",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-8 py-5"
          style={{ backgroundColor: "#c77486" }}
        >
          <HamburgerMenu />

          <p className="text-xl font-semibold tracking-wide" style={{ color: "#5e3a4d" }}>
            Moon Candles
          </p>

          <Link href="/cart" aria-label="Cart">
            <ShoppingCart size={22} style={{ color: "#5e3a4d" }} />
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}