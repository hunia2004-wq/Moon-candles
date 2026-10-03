"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function ActiveToggle({
  productId,
  initialActive,
}: {
  productId: number;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);
const router = useRouter();
async function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  e.stopPropagation();

  const card = e.currentTarget.closest("a") as HTMLElement | null;

  const next = !active;
  setActive(next);
  if (card) card.style.opacity = next ? "1" : "0.55";
  setSaving(true);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ is_active: next })
    .eq("id", productId)
    .select("id");

  if (error || !data || data.length === 0) {
    setActive(!next);
    if (card) card.style.opacity = !next ? "1" : "0.55";
    alert(error ? `Couldn't update: ${error.message}` : "Update was blocked by a database policy");
  } else {
    router.refresh();
  }

  setSaving(false);
}

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      aria-label={active ? "Deactivate product" : "Activate product"}
      className="
        relative
        flex
        h-7
        w-12
        shrink-0
        items-center
        rounded-full
        p-[3px]
        transition-all
        duration-200
        ease-out
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
      style={{
        backgroundColor: active ? "#DE4B33" : "rgba(0,0,0,0.10)",
        boxShadow: active
          ? "0 2px 8px rgba(222,75,51,0.22)"
          : "inset 0 0 0 1px rgba(0,0,0,0.06)",
      }}
    >
      <span
        className="
          h-[22px]
          w-[22px]
          rounded-full
          bg-white
          shadow-sm
          transition-transform
          duration-200
          ease-out
        "
        style={{
          transform: active
            ? "translateX(20px)"
            : "translateX(0px)",
        }}
      />
    </button>
  );
}