"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/custom-orders", label: "Custom Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customers", label: "Customers" },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
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
          onClick={handleSignOut}
          className="text-xs font-semibold"
          style={{ color: "#DE4B33" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}