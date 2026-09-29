"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Promo = {
  id: string;
  title: string;
  subtitle: string | null;
  link_url: string | null;
};

export default function PromoBanner() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("promotions")
        .select("id, title, subtitle, link_url")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("sort_order", { ascending: true });

      if (error || !data) return;
      setPromos(data as Promo[]);
    }
    load();
  }, []);

  if (promos.length === 0) return null;

  return (
    <div
      className="flex w-full gap-2 overflow-x-auto px-3 py-2.5"
      style={{
        backgroundColor: "#DE4B33",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {promos.map((promo) => (
        <button
          key={promo.id}
          type="button"
          onClick={() => {
            if (promo.link_url) router.push(promo.link_url);
          }}
          className="flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            color: "#FFF4E6",
          }}
        >
          <span className="tracking-wide">{promo.title}</span>
          {promo.subtitle && (
            <span className="hidden opacity-80 sm:inline">— {promo.subtitle}</span>
          )}
          {promo.link_url && (
            <span className="underline underline-offset-2">Shop now</span>
          )}
        </button>
      ))}
    </div>
  );
}