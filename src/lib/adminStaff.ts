import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export const WHO_COOKIE = "admin_who";

export async function getStaffNames(): Promise<string[]> {
  const { data } = await db.from("admin_staff").select("name").order("name");
  return (data ?? []).map((r: { name: string }) => r.name);
}

// The name this person picked, only if it's still on the staff list
export async function getActingName(): Promise<string | null> {
  const value = (await cookies()).get(WHO_COOKIE)?.value;
  if (!value) return null;
  const names = await getStaffNames();
  return names.includes(value) ? value : null;
}
