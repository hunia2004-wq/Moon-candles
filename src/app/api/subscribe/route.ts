import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: allowed } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin
    .from("push_subscriptions")
    .upsert({ endpoint, p256dh, auth, admin_email: user.email }, { onConflict: "endpoint" });

  if (error) {
    console.error("Saving subscription failed:", error.message);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // Welcome push so the owner sees right away that it works
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({
        title: "Order alerts are on 🔔",
        body: "You'll get a notification for every new order.",
        url: "/admin/orders",
      })
    );
  } catch (err) {
    console.error("Welcome push failed:", err);
  }

  return NextResponse.json({ ok: true });
}