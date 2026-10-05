type SlipItem = {
  productName?: string;
  color?: string | null;
  option?: string | null;
  scent?: string | null;
  quantity?: number;
  price?: number;
  customization?: { type?: string } | null;
  detail?: string;   // ready-made description line, used as is
  amount?: number;   // ready-made line total, used as is
};

type SlipOrder = {
  order_code: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  governorate: string | null;
  address: string | null;
  items: SlipItem[] | null;
  total: number | null;
  shipping_fee: number | null;
  payment_status: string | null;
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemDetail(item: SlipItem): string {
  if (item.detail !== undefined) return item.detail;

  const colorLower = item.color?.trim().toLowerCase();
  // ...rest unchanged

  if (colorLower === "unscented") return "Unscented";
  if (colorLower === "scented") {
    return item.scent ? `Scented — ${item.scent}` : "Scented";
  }

  const noScent = item.productName === "Fan" || item.productName === "Tambourine";
  const scentLabel = item.scent ? item.scent : noScent ? null : "Unscented";

  return [item.color, item.option, scentLabel].filter(Boolean).join(" · ");
}

export function printPackingSlip(order: SlipOrder) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups to print the packing slip.");
    return;
  }

  const items = order.items ?? [];
  const shipping = Number(order.shipping_fee ?? 0);
  const total = Number(order.total ?? 0);
  const itemsTotal = total - shipping;
  const isPaid = order.payment_status === "paid";
  const date = new Date(order.created_at).toLocaleDateString("en-GB");

  const rows = items
    .map((item) => {
      const detail = itemDetail(item);
      const custom = item.customization?.type
        ? `<div class="muted">Customized (${esc(item.customization.type)})</div>`
        : "";
      const qty = Number(item.quantity ?? 1);
           const amount = item.amount ?? Number(item.price ?? 0) * qty;

      return `
        <tr>
          <td>
            <div class="name">${esc(item.productName)}</div>
            ${detail ? `<div class="muted">${esc(detail)}</div>` : ""}
            ${custom}
          </td>
          <td class="center">${qty}</td>
          <td class="right">${amount.toLocaleString()} LE</td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="format-detection" content="telephone=no" />
  <title>Packing slip ${esc(order.order_code ?? "")}</title>
  <style>
    * { box-sizing: border-box; }
      a { color: inherit; text-decoration: none; }
    body { font-family: Georgia, "Times New Roman", serif; color: #000; margin: 0; padding: 24px; }
    .sheet { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 26px; letter-spacing: 0.2em; text-align: center; margin: 0 0 4px; }
    .tag { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
    h2 { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin: 20px 0 6px; }
    .block { font-size: 14px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #000; padding: 6px 0; }
    td { padding: 10px 0; border-bottom: 1px dashed #bbb; vertical-align: top; }
    .center { text-align: center; width: 50px; }
    .right { text-align: right; width: 110px; }
    .name { font-weight: bold; }
    .muted { font-size: 12px; color: #555; }
    .totals { margin-top: 12px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
    .grand { border-top: 2px solid #000; margin-top: 6px; padding-top: 8px !important; font-size: 17px; font-weight: bold; }
    .pay { margin-top: 18px; border: 1.5px solid #000; padding: 10px; text-align: center; font-size: 14px; font-weight: bold; }
    .thanks { margin-top: 24px; text-align: center; font-size: 12px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>MOON CANDLES</h1>
    <div class="tag">Handmade with love</div>

    <div class="meta">
      <span><strong>${esc(order.order_code ?? "Order")}</strong></span>
      <span>${esc(date)}</span>
    </div>
 
    <h2>Deliver to</h2>
    <div class="block">
      <strong>${esc(order.customer_name || "Customer")}</strong><br />
      ${esc(order.customer_phone || "")}<br />
      ${esc(order.governorate || "")}<br />
      ${esc(order.address || "")}
    </div>

    <h2>Items</h2>
    <table>
      <thead>
        <tr><th>Item</th><th class="center">Qty</th><th class="right">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Items total</span><span>${itemsTotal.toLocaleString()} LE</span></div>
      <div><span>Shipping</span><span>${shipping.toLocaleString()} LE</span></div>
      <div class="grand"><span>Total</span><span>${total.toLocaleString()} LE</span></div>
    </div>

    <div class="pay">
      ${isPaid ? "PAID" : `CASH ON DELIVERY — COLLECT ${total.toLocaleString()} LE`}
    </div>

    <div class="thanks">Thank you for choosing Moon.</div>
  </div>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}