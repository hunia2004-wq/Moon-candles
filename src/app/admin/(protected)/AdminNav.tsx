"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Custom Orders", href: "/admin/custom-orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Promotions", href: "/admin/discounts" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Profile", href: "/admin/profile" },
  {label:"Activity Log", href:"/admin/activity"}
];

type Section = "orders" | "custom_orders";

// Which badge section (if any) the current page belongs to
function sectionForPath(path: string): Section | null {
  if (path === "/admin/orders" || path.startsWith("/admin/orders/")) return "orders";
  if (path === "/admin/custom-orders" || path.startsWith("/admin/custom-orders/"))
    return "custom_orders";
  return null;
}

const BADGE_SECTION: Record<string, Section> = {
  "/admin/orders": "orders",
  "/admin/custom-orders": "custom_orders",
};
// Same rule the Custom Orders page uses to decide an order belongs there
function hasCustomizedItems(items: unknown): boolean {
  return (
    Array.isArray(items) &&
    items.some((item: any) => item?.category === "giveaway" || !!item?.customization)
  );
}

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<Section, number>>({
    orders: 0,
    custom_orders: 0,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lets the live listener know which page is open without re-subscribing
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  // Saves "I've seen everything up to now" for this owner and clears the badge
  async function markSeen(section: Section) {
    setCounts((c) => ({ ...c, [section]: 0 }));

    const supabase = createClient();
    await supabase.from("admin_seen").upsert({
      email,
      section,
      seen_at: new Date().toISOString(),
    });
  }

  // Initial load: count items created after each section's last-seen time
  useEffect(() => {
    const supabase = createClient();

    async function loadCounts() {
      const { data: seenRows } = await supabase
        .from("admin_seen")
        .select("section, seen_at")
        .eq("email", email);

      const seenAt: Record<string, string> = {};
      (seenRows ?? []).forEach((r: any) => {
        seenAt[r.section] = r.seen_at;
      });

      const sections: { section: Section; table: string }[] = [
        { section: "orders", table: "orders" },
        { section: "custom_orders", table: "custom_orders" },
      ];

      const next: Record<Section, number> = { orders: 0, custom_orders: 0 };

           for (const { section, table } of sections) {
        // First time for this owner: start the clock now, nothing is "new"
        if (!seenAt[section]) {
          await supabase.from("admin_seen").upsert({
            email,
            section,
            seen_at: new Date().toISOString(),
          });
          continue;
        }

        const { count } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .gt("created_at", seenAt[section]);

        let total = count ?? 0;

        // The Custom Orders page also lists regular orders that contain
        // giveaways or customized items, so count those as new too.
        if (section === "custom_orders") {
          const { data: newOrders } = await supabase
            .from("orders")
            .select("items")
            .gt("created_at", seenAt[section]);

          total += (newOrders ?? []).filter((o: any) => hasCustomizedItems(o.items)).length;
        }

        next[section] = total;
      }

      // Don't show a badge for the page that is open right now
      const current = sectionForPath(pathRef.current);
      if (current) next[current] = 0;

      setCounts(next);
    }

    loadCounts();

    // Live: a new order or custom order bumps its badge immediately
    function onInsert(section: Section) {
      if (sectionForPath(pathRef.current) === section) {
        // Already looking at that page, so it counts as seen
        markSeen(section);
      } else {
        setCounts((c) => ({ ...c, [section]: c[section] + 1 }));
      }
    }

    const channel = supabase
      .channel("admin-nav-orders")
           .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload: any) => {
          onInsert("orders");
          if (hasCustomizedItems(payload.new?.items)) onInsert("custom_orders");
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_orders" }, () =>
        onInsert("custom_orders")
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Opening Orders or Custom Orders clears that badge
  useEffect(() => {
    const section = sectionForPath(pathname);
    if (section) markSeen(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close the mobile menu whenever the route changes (after tapping a link).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const totalNew = counts.orders + counts.custom_orders;

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function Badge({ href }: { href: string }) {
    const section = BADGE_SECTION[href];
    const n = section ? counts[section] : 0;
    if (n <= 0) return null;
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
      >
        {n}
      </span>
    );
  }

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* MOBILE TOP BAR — fixed, so it's fully out of the layout's    */}
      {/* flex row and can never stretch/squeeze the sidebar+main      */}
      {/* row next to it. Only visible below md.                       */}
      {/* ---------------------------------------------------------- */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: "#FFF9F0", borderBottom: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex items-center gap-2"
        >
          <div className="flex flex-col gap-[3px] w-5">
            <span
              className="h-[1.5px] w-full transition-transform"
              style={{
                backgroundColor: "#000000",
                transform: mobileOpen ? "translateY(4.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="h-[1.5px] w-full transition-opacity"
              style={{ backgroundColor: "#000000", opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="h-[1.5px] w-full transition-transform"
              style={{
                backgroundColor: "#000000",
                transform: mobileOpen ? "translateY(-4.5px) rotate(-45deg)" : "none",
              }}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "#000000" }}>
            Menu
          </span>
        </button>

        <p className="uppercase tracking-[0.2em] text-xs" style={{ color: "#DE4B33" }}>
          moon admin
        </p>

        {totalNew > 0 ? (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          >
            {totalNew}
          </span>
        ) : (
          <span className="w-6" />
        )}
      </header>

      {/* Spacer — holds the header's height in normal flow so page
          content isn't hidden underneath the fixed header above. */}
      <div className="md:hidden h-14 w-full" aria-hidden />

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={() => setMobileOpen(false)}
        >
          <nav
            className="absolute top-14 left-0 right-0 flex flex-col gap-1 px-4 py-4"
            style={{ backgroundColor: "#FFF9F0", borderBottom: "1.5px solid rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium"
                style={{
                  backgroundColor: isActive(link.href) ? "#EFE3C4" : "transparent",
                  color: "#000000",
                }}
              >
                <span>{link.label}</span>
                <Badge href={link.href} />
              </Link>
            ))}

            <div className="mt-2 pt-3 px-3" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <p className="text-xs mb-2 truncate" style={{ color: "rgba(0,0,0,0.55)" }}>
                {email}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-semibold"
                style={{ color: "#DE4B33" }}
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR — hidden below md                            */}
      {/* ---------------------------------------------------------- */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col justify-between px-5 py-8"
        style={{ backgroundColor: "#FFF9F0", borderRight: "1.5px solid rgba(0,0,0,0.08)" }}
      >
        <div>
          <p className="uppercase tracking-[0.2em] text-xs mb-8 px-2" style={{ color: "#DE4B33" }}>
            moon admin
          </p>
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive(link.href) ? "#EFE3C4" : "transparent",
                  color: "#000000",
                }}
              >
                <span>{link.label}</span>
                <Badge href={link.href} />
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-2">
          <p className="text-xs mb-2 truncate" style={{ color: "rgba(0,0,0,0.55)" }}>
            {email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-semibold"
            style={{ color: "#DE4B33" }}
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}