"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "confirmed", "in_production", "shipped", "completed", "cancelled"];

export default function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleChange(next: string) {
    setStatus(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("custom_orders").update({ status: next }).eq("id", orderId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.55)" }}>
        Status
      </label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="rounded-xl px-4 py-2 text-sm font-medium capitalize outline-none"
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
    </div>
  );
}