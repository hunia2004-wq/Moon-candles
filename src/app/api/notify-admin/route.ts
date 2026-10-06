import { NextResponse } from "next/server";
import { Resend } from "resend";
import webpush from "web-push";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { escapeHtml as e, sendTelegram } from "@/lib/telegram";

type Item = {
  productName?: string;
  color?: string | null;
  option?: string | null;
  scent?: string | null;
  quantity?: number;
};

function itemText(item: Item): string {
  const detail = [item.color, item.option, item.scent].filter(Boolean).join(" · ");
  return `${e(item.productName ?? "Item")}${detail ? ` (${e(detail)})` : ""} x${item.quantity ?? 1}`;
}

function adminUrl(table: string): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return null;
  return `${site}/admin/${table === "custom_orders" ? "custom-orders" : "orders"}`;
}

/* ---------------- Telegram message ---------------- */

function buildTelegram(table: string, r: any): string | null {
  const url = adminUrl(table);
  const link = url ? `\n<a href="${url}">Open admin panel</a>` : "";

  if (table === "orders") {
    return `🕯️ <b>New order ${e(r.order_code ?? "")}</b>\n💰 ${e(r.total)} LE${link}`;
  }

  if (table === "custom_orders") {
    return `✨ <b>New custom candle ${e(r.order_code ?? "")}</b>\n💰 ${e(r.price)} LE${link}`;
  }

  return null;
}

/* ---------------- Push notification ---------------- */

function buildPush(table: string, r: any): { title: string; body: string; url: string } | null {
  if (table === "orders") {
    return {
      title: `New order ${r.order_code ?? ""}`,
      body: `${r.total} LE`,
      url: "/admin/orders",
    };
  }

  if (table === "custom_orders") {
    return {
      title: `New custom candle ${r.order_code ?? ""}`,
      body: `${r.price} LE`,
      url: "/admin/custom-orders",
    };
  }

  return null;
}

async function sendPush(title: string, body: string, url: string) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Not set up yet: skip quietly
  if (!pub || !priv || !subject || !sbUrl || !key) return;

  webpush.setVapidDetails(subject, pub, priv);

  const db = createAdminClient(sbUrl, key);
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err: any) {
        // Device uninstalled the app or revoked permission: forget it
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("Push failed:", err?.statusCode, err?.body);
        }
      }
    })
  );
}

/* ---------------- Email ---------------- */

function buildEmail(table: string, r: any): { subject: string; html: string } | null {
  const url = adminUrl(table);
  const button = url
    ? `<p style="margin:24px 0 0;"><a href="${url}" style="background:#47684b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;">Open admin panel</a></p>`
    : "";

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px;vertical-align:top;">${label}</td><td style="padding:4px 0;font-size:14px;">${value}</td></tr>`;

  const wrap = (title: string, rows: string, totalLine: string) => `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;color:#000;">
      <h2 style="margin:0 0 16px;font-size:22px;color:#47684b;">${title}</h2>
      <table style="border-collapse:collapse;">${rows}</table>
      <p style="margin:20px 0 0;font-size:18px;"><strong>${totalLine}</strong></p>
      ${button}
    </div>`;

  if (table === "orders") {
    const items = (Array.isArray(r.items) ? r.items : []) as Item[];
    return {
      subject: `New order ${r.order_code ?? ""} · ${r.total} LE`,
      html: wrap(
        `New order ${e(r.order_code ?? "")}`,
        [
          row("Customer", `${e(r.customer_name)} · ${e(r.customer_phone)}`),
          row("Deliver to", `${e(r.governorate)} — ${e(r.address)}`),
          row("Items", items.map(itemText).join("<br />") || "—"),
          row("Payment", "Cash on delivery"),
        ].join(""),
        `${e(r.total)} LE <span style="font-weight:normal;font-size:13px;color:#666;">(shipping ${e(r.shipping_fee ?? 0)} LE)</span>`
      ),
    };
  }

  if (table === "custom_orders") {
    return {
      subject: `New custom candle ${r.order_code ?? ""} · ${r.price} LE`,
      html: wrap(
        `New custom candle ${e(r.order_code ?? "")}`,
        [
          row("Customer", `${e(r.customer_name)} · ${e(r.customer_phone)}`),
          row("Deliver to", `${e(r.governorate)} — ${e(r.address)}`),
          row("Candle", `${e(r.size_label)} · ${e(r.scent || "No scent chosen")}`),
          row("Label", r.message ? `"${e(r.message)}"` : "No message"),
          row("Photo", r.photo_url ? "Uploaded" : "None"),
        ].join(""),
        `${e(r.price)} LE <span style="font-weight:normal;font-size:13px;color:#666;">(shipping included)</span>`
      ),
    };
  }

  return null;
}

async function sendAdminEmail(subject: string, html: string) {
  const recipients = (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Not set up yet: skip quietly, Telegram still goes out
  if (recipients.length === 0 || !process.env.RESEND_API_KEY) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Moon Candles <onboarding@resend.dev>",
    to: recipients,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
}

/* ---------------- Route ---------------- */

export async function POST(req: Request) {
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;

  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  // Only new rows are interesting; ignore updates and deletes
  if (!body || body.type !== "INSERT" || !body.record) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const telegram = buildTelegram(body.table, body.record);
  const email = buildEmail(body.table, body.record);
  const push = buildPush(body.table, body.record);

  if (!telegram || !email) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // One channel failing never blocks the others
  const [tg, mail, pushed] = await Promise.allSettled([
    sendTelegram(telegram),
    sendAdminEmail(email.subject, email.html),
    push ? sendPush(push.title, push.body, push.url) : Promise.resolve(),
  ]);

  if (tg.status === "rejected") console.error("Telegram notification failed:", tg.reason);
  if (mail.status === "rejected") console.error("Admin email failed:", mail.reason);
  if (pushed.status === "rejected") console.error("Push notification failed:", pushed.reason);

  if (tg.status === "rejected" && mail.status === "rejected" && pushed.status === "rejected") {
    return NextResponse.json({ error: "All notifications failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    telegram: tg.status === "fulfilled",
    email: mail.status === "fulfilled",
    push: pushed.status === "fulfilled",
  });
}