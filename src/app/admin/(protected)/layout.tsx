import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";
import EnablePush from "./EnablePush";

export const metadata: Metadata = {
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    title: "Moon Admin",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icon-512.png",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: allowed } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!allowed) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ backgroundColor: "#FFF4E6" }}>
      <AdminNav email={user.email ?? ""} />
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10 overflow-y-auto">
        <EnablePush />
        {children}
      </main>
    </div>
  );
}