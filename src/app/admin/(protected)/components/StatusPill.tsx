const STATUS_COLORS: Record<string, string> = {
    pending: "#D08A1E",
  confirmed: "#3F8F5C",
  in_production: "#5A7CA8",
  shipped: "#3F8F5C",
  completed: "#3A6DB0",
  cancelled: "#A34848",
  // payment_status values reuse this component too
  unpaid: "#A34848",
  paid: "#3A6DB0",
  refunded: "#7A6A58",
};

export default function StatusPill({ status }: { status: string | null }) {
  const value = status ?? "pending";
  const color = STATUS_COLORS[value] ?? "rgba(0,0,0,0.5)";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {value.replace("_", " ")}
    </span>
  );
}