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
  price?: number | string | null;
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
const SAGE = "#8FAA82";
const SAND = "#EFE3C4";
const WHITE = "#FFFFFF";

// Gmail's mobile dark mode inverts plain background colors but leaves cells
// with a background-image alone. A same-color gradient locks the color in,
// while background-color stays as a fallback for other clients.
const solid = (c: string) =>
  `background-color: ${c}; background-image: linear-gradient(${c}, ${c});`;

function buildCustomerEmail(r: any): { subject: string; html: string } {
  const items = (Array.isArray(r.items) ? r.items : []) as Item[];

  const total = Number(r.total) || 0;
  const shippingFee = Number(r.shipping_fee) || 0;
  const subtotal = total - shippingFee;

  const firstName =
    String(r.customer_name ?? "").trim().split(" ")[0] || "there";

  const itemsHtml = items
    .map((item) => {
      const price = Number(item.price);
      const qty = item.quantity ?? 1;
      const hasPrice = Number.isFinite(price) && price > 0;
      const detail = [item.color, item.option, item.scent]
        .filter(Boolean)
        .join(" · ");

      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid ${SAGE}; vertical-align: top;">
            <div style="font-weight: 700; font-size: 15px; color: ${SAGE}; margin-bottom: 5px;">
              ${e(item.productName ?? "Item")}
            </div>
            ${
              detail
                ? `<div style="font-size: 12px; color: ${SAGE}; margin-bottom: 5px;">${e(detail)}</div>`
                : ""
            }
            <div style="font-size: 12px; color: ${SAGE};">
              ${hasPrice ? `${price} EGP × ${qty}` : `× ${qty}`}
            </div>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid ${SAGE}; text-align: right; vertical-align: top; font-size: 15px; font-weight: 700; color: ${SAGE};">
            ${hasPrice ? `${(price * qty).toLocaleString()} EGP` : "&nbsp;"}
          </td>
        </tr>`;
    })
    .join("");

  const stripesHtml = Array.from({ length: 21 })
    .map((_, i) => {
      const c = i % 2 === 0 ? SAGE : SAND;
      return `<td bgcolor="${c}" style="${solid(c)} height: 10px; line-height: 10px; font-size: 0;">&nbsp;</td>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en" style="color-scheme: light only; supported-color-schemes: light only;">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light only" />
      <style>
        :root { color-scheme: light only; supported-color-schemes: light only; }
      </style>
    </head>
    <body bgcolor="${SAND}" style="margin: 0; padding: 0; ${solid(SAND)}">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SAND}" style="${solid(SAND)}">
      <tr>
        <td align="center" bgcolor="${SAND}" style="${solid(SAND)} font-family: Georgia, serif; padding: 40px 20px;">

          <table role="presentation" align="center" width="480" cellpadding="0" cellspacing="0" border="0" bgcolor="${WHITE}" style="max-width: 480px; width: 100%; ${solid(WHITE)} border-radius: 16px; overflow: hidden;">
            <tr>
              <td bgcolor="${WHITE}" style="${solid(WHITE)}">

                <!-- STRIPE BAR -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <tr>${stripesHtml}</tr>
                </table>

                <!-- TOP SAGE STRIPE -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAGE}" style="${solid(SAGE)} text-align: center; padding: 32px 24px;">
                      <div style="color: ${SAND}; font-size: 11px; letter-spacing: 0.2em; margin-bottom: 10px;">
                        THANK YOU FOR YOUR ORDER
                      </div>
                      <h1 style="margin: 0; color: ${SAND}; font-size: 27px; letter-spacing: 0.08em; font-weight: 700;">
                        MOON CANDLES
                      </h1>
                    </td>
                  </tr>
                </table>

                <!-- SAND STRIPE — INTRO -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAND}" style="${solid(SAND)} padding: 30px 28px;">
                      <p style="margin: 0 0 10px; color: ${SAGE}; font-size: 20px; font-weight: 700;">
                        Hi ${e(firstName)}, ✨
                      </p>
                      <p style="margin: 0; color: ${SAGE}; font-size: 15px; line-height: 1.75;">
                        Thank you so much for your order, every candle is poured
                        and every giveaway is packed with care, and we can't wait
                        for yours to arrive. We hope it brings a little extra
                        warmth and light to your day. 🌙
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- SAGE STRIPE — ORDER NUMBER -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 22px 28px;">
                      <div style="color: ${SAND}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 6px;">
                        ORDER NUMBER
                      </div>
                      <div style="color: ${SAND}; font-size: 24px; font-weight: 700;">
                        ${e(r.order_code ?? "")}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- SAND STRIPE — ORDER -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAND}" style="${solid(SAND)} padding: 28px;">
                      <div style="color: ${SAGE}; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; margin-bottom: 12px;">
                        YOUR ORDER
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- SAGE STRIPE — ORDER TOTALS -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 24px 28px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: ${SAND}; font-size: 14px;">Subtotal</td>
                          <td style="padding: 6px 0; color: ${SAND}; font-size: 14px; text-align: right;">${subtotal.toLocaleString()} EGP</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: ${SAND}; font-size: 14px;">Shipping</td>
                          <td style="padding: 6px 0; color: ${SAND}; font-size: 14px; text-align: right;">${shippingFee.toLocaleString()} EGP</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding-top: 14px; border-top: 1px solid ${SAND};"></td>
                        </tr>
                        <tr>
                          <td style="padding-top: 4px; color: ${SAND}; font-size: 18px; font-weight: 700;">Total</td>
                          <td style="padding-top: 4px; color: ${SAND}; font-size: 20px; font-weight: 700; text-align: right;">${total.toLocaleString()} EGP</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- SAND STRIPE — MESSAGE -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAND}" style="${solid(SAND)} padding: 28px; text-align: center;">
                      <p style="margin: 0; color: ${SAGE}; font-size: 14px; line-height: 1.7;">
                        We'll have this ready and on its way to you soon. 🌙
                      </p>
                      <p style="margin: 14px 0 0; color: ${SAGE}; font-size: 12px; line-height: 1.7;">
                        If anything comes up, just reply to this email or
                        reach us on Instagram
                        <strong>@the_moon_candlesshop</strong>.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- FINAL SAGE STRIPE -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 26px 20px; text-align: center;">
                      <div style="color: ${SAND}; font-size: 10px; letter-spacing: 0.18em; margin-bottom: 8px;">WITH LOVE</div>
                      <div style="color: ${SAND}; font-size: 15px; font-weight: 700;">The Moon Candles Team 🕯️</div>
                    </td>
                  </tr>
                </table>

                <!-- FINAL SAND STRIPE -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${SAND}" style="${solid(SAND)} height: 18px; line-height: 18px; font-size: 0;">&nbsp;</td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    </body>
    </html>
  `;

  return {
    subject: `Your Moon Candles order ${r.order_code ?? ""} · ${r.total} LE`,
    html,
  };
}

async function sendCustomerEmail(r: any) {
  const to = typeof r.customer_email === "string" ? r.customer_email.trim() : "";

  // No email entered or Resend not set up: skip quietly
  if (!to || !process.env.RESEND_API_KEY) return;

  const { subject, html } = buildCustomerEmail(r);
  const resend = new Resend(process.env.RESEND_API_KEY);
 const { error } = await resend.emails.send({
  from: process.env.EMAIL_FROM ?? "Moon Candles <onboarding@resend.dev>",
  to,
  replyTo: "themooncandleshopp@gmail.com",
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
 const [tg, mail, pushed, customerMail] = await Promise.allSettled([
  sendTelegram(telegram),
  sendAdminEmail(email.subject, email.html),
  push ? sendPush(push.title, push.body, push.url) : Promise.resolve(),
  body.table === "orders" ? sendCustomerEmail(body.record) : Promise.resolve(),
]);

if (customerMail.status === "rejected") console.error("Customer email failed:", customerMail.reason);

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