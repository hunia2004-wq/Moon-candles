"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Custom Orders", href: "/admin/custom-orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Discounts", href: "/admin/discounts" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Profile", href: "/admin/profile" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadPendingCount() {
      const [orders, customOrders] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("custom_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setPendingCount((orders.count ?? 0) + (customOrders.count ?? 0));
    }
    loadPendingCount();

    // Live badge: bump the count the moment a new order/custom order lands.
    const channel = supabase
      .channel("admin-nav-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () =>
        setPendingCount((c) => c + 1)
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_orders" }, () =>
        setPendingCount((c) => c + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

        {pendingCount > 0 ? (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          >
            {pendingCount}
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
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium"
                  style={{
                    backgroundColor: active ? "#EFE3C4" : "transparent",
                    color: "#000000",
                  }}
                >
                  <span>{link.label}</span>
                  {link.href === "/admin/orders" && pendingCount > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}

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
      {/* DESKTOP SIDEBAR — unchanged, hidden below md                 */}
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
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "#EFE3C4" : "transparent",
                    color: "#000000",
                  }}
                >
                  <span>{link.label}</span>
                  {link.href === "/admin/orders" && pendingCount > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
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