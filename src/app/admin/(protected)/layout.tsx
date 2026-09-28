import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

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
    <div className="flex min-h-screen" style={{ backgroundColor: "#FFF4E6" }}>
      <AdminNav email={user.email ?? ""} />
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10 overflow-y-auto">{children}</main>
    </div>
  );
}