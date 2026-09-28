"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import FloatingMoon from "./FloatingMoon";
import Footer from "./Footer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <FloatingMoon />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}