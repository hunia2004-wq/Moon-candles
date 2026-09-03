import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import FloatingMoon from "./components/FloatingMoon";
import { ActiveCandleProvider } from "./components/ActiveCandleContext";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#efe3c4" }}
      >
               <ActiveCandleProvider>
          <Header />
          <FloatingMoon />
          <CartDrawer />
          <div className="flex-1 flex flex-col">{children}</div>
        </ActiveCandleProvider>

        <Footer />
      </body>
    </html>
  );
}