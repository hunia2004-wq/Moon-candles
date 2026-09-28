const STATUS_COLORS: Record<string, string> = {
  pending: "#B8862F",
  confirmed: "#8B6FB0",
  in_production: "#5A7CA8",
  shipped: "#4A8F8F",
  completed: "#3F8F5C",
  cancelled: "#A34848",
  // payment_status values reuse this component too
  unpaid: "#A34848",
  paid: "#3F8F5C",
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