"use client";
import { DELETED_EVENT } from "@/lib/soft-delete";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Package,
  Users,
  Tag,
  Star,
  History,
  User,
  Trash2,
  FlaskConical,
} from "lucide-react";

const LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Custom Orders", href: "/admin/custom-orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Scents", href: "/admin/scents" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Promotions", href: "/admin/discounts" },
  { label: "Reviews", href: "/admin/reviews" },
  {label:"Activity Log", href:"/admin/activity"},
  { label: "Profile", href: "/admin/profile" }
  
];

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Dashboard: LayoutDashboard,
  Orders: ShoppingBag,
  "Custom Orders": Sparkles,
  Products: Package,
  Scents: FlaskConical,
  Customers: Users,
  Promotions: Tag,
  Reviews: Star,
  "Activity Log": History,
  Profile: User,
};

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

export default function AdminNav({ email }: { email: string; deletedCount?: number }) {
  const pathname = usePathname();
  const [deletedCount, setDeletedCount] = useState(0);

  // Badge = items deleted since the bin was last opened. Opening the bin clears it.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function syncDeleted() {
      const now = new Date().toISOString();

      if (pathname.startsWith("/admin/recently-deleted")) {
        setDeletedCount(0);
        await supabase
          .from("admin_seen")
          .upsert({ email, section: "recently_deleted", seen_at: now });
        return;
      }

      const { data: row } = await supabase
        .from("admin_seen")
        .select("seen_at")
        .eq("email", email)
        .eq("section", "recently_deleted")
        .maybeSingle();

      if (!row) {
        await supabase
          .from("admin_seen")
          .upsert({ email, section: "recently_deleted", seen_at: now });
        return;
      }

      const results = await Promise.all(
        ["products", "orders", "custom_orders", "scent_catalog"].map((table) =>
          supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .gt("deleted_at", row.seen_at)
        )
      );

      if (!cancelled) {
        results.forEach((r) => r.error && console.error("Recently deleted badge:", r.error.message));
        setDeletedCount(results.reduce((sum, r) => sum + (r.count ?? 0), 0));
      }
    }

    syncDeleted();
    window.addEventListener(DELETED_EVENT, syncDeleted);
    window.addEventListener("focus", syncDeleted);
    const timer = setInterval(syncDeleted, 15000);
    return () => {
      cancelled = true;
      window.removeEventListener(DELETED_EVENT, syncDeleted);
      window.removeEventListener("focus", syncDeleted);
      clearInterval(timer);
    };
  }, [pathname, email]);
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
          .is("deleted_at", null)
          .gt("created_at", seenAt[section]);

        let total = count ?? 0;

        // The Custom Orders page also lists regular orders that contain
        // giveaways or customized items, so count those as new too.
        if (section === "custom_orders") {
          const { data: newOrders } = await supabase
            .from("orders")
            .select("items").is("deleted_at", null)
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
    try { sessionStorage.removeItem("actingAsConfirmed"); } catch {}
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

        <div className="flex items-center gap-2"><Link href="/admin/recently-deleted" aria-label="Recently deleted" className="relative flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: deletedCount > 0 ? "#EFE3C4" : "transparent", color: "rgba(0,0,0,0.6)" }}><Trash2 size={16} strokeWidth={1.8} />{deletedCount > 0 && (<span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ backgroundColor: "#DE4B33", color: "#FFFFFF" }}>{deletedCount}</span>)}</Link>{totalNew > 0 ? (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          >
            {totalNew}
          </span>
        ) : (
          <span className="w-6" />
        )}
      </div>
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
            className="absolute top-14 left-0 right-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 pb-5 pt-4"
            style={{
              backgroundColor: "#FFF9F0",
              borderBottom: "1.5px solid rgba(0,0,0,0.08)",
              borderRadius: "0 0 24px 24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              {LINKS.map((link) => {
                const active = isActive(link.href);
                const Icon = ICONS[link.label];
                const section = BADGE_SECTION[link.href];
                const n = section ? counts[section] : 0;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
                    style={{
                      backgroundColor: active ? "#DE4B33" : "#FFFFFF",
                      color: active ? "#FFF4E6" : "#000000",
                      border: active ? "1px solid #DE4B33" : "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    {Icon && <Icon size={18} strokeWidth={1.8} />}
                    <span className="flex-1">{link.label}</span>
                    {n > 0 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: active ? "#FFF4E6" : "#DE4B33",
                          color: active ? "#DE4B33" : "#FFF4E6",
                        }}
                      >
                        {n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <Link href="/admin/recently-deleted" className="mt-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold" style={{ border: "1.5px dashed rgba(0,0,0,0.25)", color: "rgba(0,0,0,0.65)" }}><span className="flex items-center gap-2"><Trash2 size={15} strokeWidth={1.8} />Recently deleted</span>{deletedCount > 0 && (<span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "#DE4B33", color: "#FFFFFF" }}>{deletedCount}</span>)}</Link><div
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ backgroundColor: "#EFE3C4" }}
            >
              <p className="min-w-0 truncate text-xs" style={{ color: "rgba(0,0,0,0.65)" }}>
                {email}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: "#FFFFFF", color: "#DE4B33" }}
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

        <div className="px-2"><Link href="/admin/recently-deleted" className="mb-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={{ border: "1.5px dashed rgba(0,0,0,0.25)", color: "rgba(0,0,0,0.65)" }}><span className="flex items-center gap-2"><Trash2 size={15} strokeWidth={1.8} />Recently deleted</span>{deletedCount > 0 && (<span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "#DE4B33", color: "#FFFFFF" }}>{deletedCount}</span>)}</Link>
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