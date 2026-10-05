"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "confirmed", "in_production", "shipped", "completed", "cancelled"];

export default function StatusUpdater({
  orderId,
  currentStatus,
  compact = false,
}: {
  orderId: string;
  currentStatus: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleChange(next: string) {
    const previous = status;

    setStatus(next);
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("custom_orders")
      .update({ status: next })
      .eq("id", orderId)
      .select("id");

    setSaving(false);

    if (updateError || !data || data.length === 0) {
      setStatus(previous);
      setError(updateError?.message ?? "Couldn't save. Please try again.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!compact && (
        <label className="text-xs uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.55)" }}>
          Status
        </label>
      )}

      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        // Keeps a tap on the dropdown from opening the card around it
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl font-medium capitalize outline-none ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
        style={{ border: "1.5px solid #DE4B33", backgroundColor: "#EFE3C4", color: "#000000" }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>

      {saving && (
        <span className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
          Saving…
        </span>
      )}

      {error && (
        <span className="text-xs font-medium" style={{ color: "#DE4B33" }}>
          {error}
        </span>
      )}
    </div>
  );
}