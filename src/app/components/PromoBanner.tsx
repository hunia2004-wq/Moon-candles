"use client";

import { useEffect, useRef, useState } from "react";
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
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Auto-rotate through multiple active promos every 5s.
  useEffect(() => {
    if (promos.length <= 1) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % promos.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [promos.length]);

  if (promos.length === 0) return null;

  const current = promos[index];

  function handleClick() {
    if (current.link_url) router.push(current.link_url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-center transition-colors"
      style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
    >
      <span className="text-xs sm:text-sm font-semibold tracking-wide">
        {current.title}
      </span>
      {current.subtitle && (
        <span className="hidden sm:inline text-xs opacity-90">
          — {current.subtitle}
        </span>
      )}
      {current.link_url && (
        <span className="text-xs underline underline-offset-2 ml-1 shrink-0">
          Shop now
        </span>
      )}
    </button>
  );
}