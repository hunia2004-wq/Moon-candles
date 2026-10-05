type ExportItem = {
  productName?: string;
  color?: string | null;
  option?: string | null;
  scent?: string | null;
  quantity?: number;
};

type ExportOrder = {
  order_code: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  governorate: string | null;
  address: string | null;
  items: ExportItem[] | null;
  shipping_fee: number | null;
  total: number | null;
  status: string | null;
  payment_status: string | null;
  assignee: string | null;
};

// Wraps a value for CSV. Values starting with = + - @ get a leading
// apostrophe so a spreadsheet can't run them as a formula.
function cell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// Phone numbers keep their leading zero in Excel and Google Sheets
// Spaces make spreadsheets treat it as text, so the leading 0 stays
// and no formula wrapper is needed
function phoneCell(value: string | null): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11) {
    return `"${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}"`;
  }

  return cell(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function itemsText(items: ExportItem[] | null): string {
  return (items ?? [])
    .map((item) => {
      const detail = [item.color, item.option, item.scent].filter(Boolean).join(" · ");
      return `${item.productName ?? "Item"}${detail ? ` (${detail})` : ""} x${item.quantity ?? 1}`;
    })
    .join("; ");
}

export function exportOrdersCsv(orders: ExportOrder[], label: string) {
  const header = [
    "Order",
    "Date",
    "Customer",
    "Phone",
    "Email",
    "Governorate",
    "Address",
    "Items",
    "Shipping (LE)",
    "Total (LE)",
    "Status",
    "Payment",
    "Assigned to",
  ];

  const rows = orders.map((o) =>
    [
      cell(o.order_code),
      cell(formatDate(o.created_at)),
      cell(o.customer_name),
      phoneCell(o.customer_phone),
      cell(o.customer_email),
      cell(o.governorate),
      cell(o.address),
      cell(itemsText(o.items)),
      cell(o.shipping_fee ?? 0),
      cell(o.total ?? 0),
      cell(o.status),
      cell(o.payment_status),
      cell(o.assignee),
    ].join(",")
  );

  const csv = [header.map(cell).join(","), ...rows].join("\r\n");

  // The BOM at the start makes Excel read Arabic names correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `moon-orders-${label}-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}