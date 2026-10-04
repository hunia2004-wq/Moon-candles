"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type OptionGroupDraft = {
  key: string;
  label: string;
  choices: { key: string; name: string; hex: string }[];
};

type SavedGroup = {
  label: string;
  choices: { name: string; hex?: string }[];
};

function makeKey() {
  return Math.random().toString(36).slice(2);
}

export function draftsFromGroups(groups: SavedGroup[] | null | undefined): OptionGroupDraft[] {
  return (groups ?? []).map((g) => ({
    key: makeKey(),
    label: g.label ?? "",
    choices: (g.choices ?? []).map((c) => ({
      key: makeKey(),
      name: c.name ?? "",
      hex: c.hex ?? "",
    })),
  }));
}

export function groupsFromDrafts(drafts: OptionGroupDraft[]): SavedGroup[] {
  return drafts
    .map((g) => ({
      label: g.label.trim(),
      choices: g.choices
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          ...(c.hex ? { hex: c.hex } : {}),
        })),
    }))
    .filter((g) => g.label && g.choices.length > 0);
}

export default function OptionGroupsEditor({

  groups,
  onChange,
}: {
  groups: OptionGroupDraft[];
  onChange: (groups: OptionGroupDraft[]) => void;
}) {
    const [sources, setSources] = useState<
    { id: number; name: string; groups: SavedGroup[] }[]
  >([]);

  useEffect(() => {
    async function loadSources() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, option_groups")
        .order("name");

      setSources(
        (data ?? [])
          .filter(
            (p: any) =>
              Array.isArray(p.option_groups) && p.option_groups.length > 0
          )
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            groups: p.option_groups,
          }))
      );
    }

    loadSources();
  }, []);

  function copyFrom(productId: string) {
    const source = sources.find((s) => String(s.id) === productId);
    if (!source) return;
    onChange([...groups, ...draftsFromGroups(source.groups)]);
  }
  function updateGroup(key: string, patch: Partial<OptionGroupDraft>) {
    onChange(groups.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  function addChoice(groupKey: string) {
    onChange(
      groups.map((g) =>
        g.key === groupKey
          ? { ...g, choices: [...g.choices, { key: makeKey(), name: "", hex: "" }] }
          : g
      )
    );
  }

  function updateChoice(
    groupKey: string,
    choiceKey: string,
    patch: Partial<{ name: string; hex: string }>
  ) {
    onChange(
      groups.map((g) =>
        g.key === groupKey
          ? { ...g, choices: g.choices.map((c) => (c.key === choiceKey ? { ...c, ...patch } : c)) }
          : g
      )
    );
  }

  function removeChoice(groupKey: string, choiceKey: string) {
    onChange(
      groups.map((g) =>
        g.key === groupKey ? { ...g, choices: g.choices.filter((c) => c.key !== choiceKey) } : g
      )
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "rgba(0,0,0,0.6)" }}
        >
          Special options (e.g. ribbon color)
        </label>
        <button
          type="button"
          onClick={() =>
            onChange([...groups, { key: makeKey(), label: "", choices: [] }])
          }
          className="rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
        >
          + Add Option Group
        </button>
      </div>
      {sources.length > 0 && (
        <select
          value=""
          onChange={(e) => copyFrom(e.target.value)}
          className="mb-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            border: "1.5px solid rgba(0,0,0,0.15)",
            backgroundColor: "#FFFFFF",
            color: "#000000",
          }}
        >
          <option value="">Copy options from another product…</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      {groups.length === 0 && (
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
          None. Customers just pick colors and scents as usual.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div
            key={group.key}
            className="rounded-2xl p-4"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFDF8" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <input
                value={group.label}
                onChange={(e) => updateGroup(group.key, { label: e.target.value })}
                placeholder="Group name (e.g. Ribbon Color)"
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
              />
              <button
                type="button"
                onClick={() => onChange(groups.filter((g) => g.key !== group.key))}
                className="flex-shrink-0 text-xs font-semibold underline"
                style={{ color: "#DE4B33" }}
              >
                remove
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {group.choices.map((choice) => (
                <div key={choice.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={choice.hex || "#CCCCCC"}
                    onChange={(e) => updateChoice(group.key, choice.key, { hex: e.target.value })}
                    className="h-9 w-9 flex-shrink-0 rounded-lg border-0"
                    style={{ opacity: choice.hex ? 1 : 0.35 }}
                  />
                  <input
                    value={choice.name}
                    onChange={(e) => updateChoice(group.key, choice.key, { name: e.target.value })}
                    placeholder="Choice name (e.g. Light Pink)"
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
                  />
                  {choice.hex && (
                    <button
                      type="button"
                      onClick={() => updateChoice(group.key, choice.key, { hex: "" })}
                      className="flex-shrink-0 text-[11px] underline"
                      style={{ color: "rgba(0,0,0,0.5)" }}
                    >
                      no color
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeChoice(group.key, choice.key)}
                    className="flex-shrink-0 text-xs font-semibold underline"
                    style={{ color: "#DE4B33" }}
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addChoice(group.key)}
              className="mt-3 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
            >
              + Add Choice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}