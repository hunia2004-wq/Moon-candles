"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [visible, setVisible] = useState(true);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fades out, switches to the target promotion, fades back in
  function goTo(target: number) {
    if (promos.length < 2) return;

    const next = (target + promos.length) % promos.length;

    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);

    setVisible(false);
    fadeTimeout.current = setTimeout(() => {
      setIndex(next);
      setVisible(true);
    }, 250);
  }

  // Auto-rotate. Depends on `index`, so any change (manual or automatic)
  // restarts the timer.
  useEffect(() => {
    if (promos.length < 2) return;

    const timer = setTimeout(() => {
      goTo(index + 1);
    }, 4500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promos.length, index]);

  useEffect(() => {
    return () => {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, []);

  if (promos.length === 0) return null;

  const current = index % promos.length;
  const promo = promos[current];
  const hasMultiple = promos.length > 1;

  function handleClick() {
    if (!promo.link_url) return;
    if (promo.link_url.startsWith("http")) {
      window.location.href = promo.link_url;
    } else {
      router.push(promo.link_url);
    }
  }

  return (
    <div
      className="relative w-full px-10 py-2.5 text-center"
      style={{ backgroundColor: "#47684b" }}
    >
      {hasMultiple && (
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous promotion"
          className="absolute left-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:opacity-50"
          style={{ color: "#FFF4E6" }}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={!promo.link_url}
        className="inline-flex max-w-full items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-opacity duration-300 disabled:cursor-default md:text-xs"
        style={{ color: "#FFF4E6", opacity: visible ? 1 : 0 }}
      >
        <span aria-hidden="true">✦</span>
        <span className="truncate">{promo.title}</span>
        {promo.subtitle && (
          <span className="hidden truncate opacity-75 sm:inline">
            — {promo.subtitle}
          </span>
        )}
        {promo.link_url && (
          <span className="flex-shrink-0 underline underline-offset-4">
            Shop now
          </span>
        )}
        <span aria-hidden="true">✦</span>
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next promotion"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:opacity-50"
          style={{ color: "#FFF4E6" }}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}

      {hasMultiple && (
        <div className="mt-1.5 flex justify-center gap-1.5">
          {promos.map((p, i) => (
            <span
              key={p.id}
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor: "#FFF4E6",
                opacity: i === current ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}