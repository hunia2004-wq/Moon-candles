import { NextResponse } from "next/server";
import { escapeHtml as e, sendTelegram } from "@/lib/telegram";

type Item = {
  productName?: string;
  color?: string | null;
  option?: string | null;
  scent?: string | null;
  quantity?: number;
};

function itemLine(item: Item): string {
  const detail = [item.color, item.option, item.scent].filter(Boolean).join(" · ");
  return `• ${e(item.productName ?? "Item")}${detail ? ` (${e(detail)})` : ""} x${item.quantity ?? 1}`;
}

function buildMessage(table: string, r: any): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const adminLink = site
    ? `\n\n<a href="${site}/admin/${table === "custom_orders" ? "custom-orders" : "orders"}">Open admin panel</a>`
    : "";

  if (table === "orders") {
    const items = (Array.isArray(r.items) ? r.items : []) as Item[];
    return [
      `🕯️ <b>New order ${e(r.order_code ?? "")}</b>`,
      `👤 ${e(r.customer_name)} · ${e(r.customer_phone)}`,
      `📍 ${e(r.governorate)} — ${e(r.address)}`,
      "",
      items.map(itemLine).join("\n"),
      "",
      `💰 <b>${e(r.total)} LE</b> (shipping ${e(r.shipping_fee ?? 0)} LE) · Cash on delivery`,
    ].join("\n") + adminLink;
  }

  if (table === "custom_orders") {
    return [
      `✨ <b>New custom candle ${e(r.order_code ?? "")}</b>`,
      `👤 ${e(r.customer_name)} · ${e(r.customer_phone)}`,
      `📍 ${e(r.governorate)} — ${e(r.address)}`,
      "",
      `🕯️ ${e(r.size_label)} · ${e(r.scent || "No scent chosen")}`,
      r.message ? `💬 "${e(r.message)}"` : "💬 No message",
      r.photo_url ? "🖼️ Photo uploaded" : "🖼️ No photo",
      "",
      `💰 <b>${e(r.price)} LE</b> (shipping included)`,
    ].join("\n") + adminLink;
  }

  return null;
}

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

  const message = buildMessage(body.table, body.record);
  if (!message) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await sendTelegram(message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram notification failed:", err);
    return NextResponse.json({ error: "Telegram failed" }, { status: 502 });
  }
}