"use client";

import { usePathname } from "next/navigation";
import PromoBanner from "./PromoBanner";

export default function ConditionalPromoBanner() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <PromoBanner />;
}