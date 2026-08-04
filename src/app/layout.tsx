import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
         <header>
<p>moon candleshop</p>
<nav>
<Link href="/">home</Link>
<Link href="/shop">shop</Link>
<Link href="/cart">cart</Link>
<Link href="/admin">admin</Link>

</nav>

          </header>
        {children}</body>
    </html>
  );
}
