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
  const [scrolls, setScrolls] = useState(false);
  const [duration, setDuration] = useState(20);
  const wrapRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

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

  // Scroll only when the text is wider than the screen
  useEffect(() => {
    function measure() {
      const wrap = wrapRef.current;
      const copy = copyRef.current;
      if (!wrap || !copy) return;
      setScrolls(copy.offsetWidth > wrap.clientWidth);
      setDuration(Math.max(12, copy.offsetWidth / 45)); // about 45px per second
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (wrapRef.current) observer.observe(wrapRef.current);
    if (copyRef.current) observer.observe(copyRef.current);

    return () => observer.disconnect();
  }, [promos]);

  if (promos.length === 0) return null;

  function go(link: string | null) {
    if (!link) return;
    if (link.startsWith("http")) {
      window.location.href = link;
    } else {
      router.push(link);
    }
  }

  function renderItems(hidden: boolean) {
    return promos.map((promo) => (
      <button
        key={`${hidden ? "b" : "a"}-${promo.id}`}
        type="button"
        onClick={() => go(promo.link_url)}
        disabled={!promo.link_url}
        tabIndex={hidden ? -1 : 0}
        aria-hidden={hidden}
        className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] disabled:cursor-default md:text-xs"
        style={{ color: "#000000" }}
      >
        <span aria-hidden="true">✦</span>
        <span>{promo.title}</span>
        {promo.subtitle && <span className="opacity-75">— {promo.subtitle}</span>}
        {promo.link_url && (
          <span className="underline underline-offset-4">Shop now</span>
        )}
        <span aria-hidden="true">✦</span>
      </button>
    ));
  }

  return (
    <div
      ref={wrapRef}
      className="promo-wrap relative w-full overflow-hidden py-2.5"
      style={{ backgroundColor: "#cdba9a" }}
    >
      <style>{`
        @keyframes promo-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
.promo-wrap:hover .promo-track { animation-play-state: paused; }
              @media (prefers-reduced-motion: reduce) {
          .promo-wrap { overflow-x: auto !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .promo-wrap::-webkit-scrollbar { display: none; }
          .promo-track { animation: none !important; }
          .promo-dup { display: none; }
        }
       
      `}</style>

      <div
        className="promo-track flex w-max min-w-full"
        style={{
          justifyContent: scrolls ? "flex-start" : "center",
          animation: scrolls
            ? `promo-marquee ${duration}s linear infinite`
            : "none",
        }}
      >
<div ref={copyRef} className="flex flex-shrink-0 items-center gap-10 px-5">
          {renderItems(false)}
        </div>

        {scrolls && (
        <div className="promo-dup flex flex-shrink-0 items-center gap-10 px-5">
            {renderItems(true)}
          </div>
        )}
      </div>
    </div>
  );
}