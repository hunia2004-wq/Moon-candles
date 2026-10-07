"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#DE4B33";
const CREAM = "#FFF4E6";
const SERIF = "Georgia, 'Times New Roman', serif";

export default function ActingAs({
  current,
  names,
}: {
  current: string | null;
  names: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!current);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show the picker once every time the admin is opened fresh (new sign-in,
  // new tab, or the Home Screen app relaunched)
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("actingAsConfirmed")) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  // If the names list is empty, never block the admin
  if (names.length === 0) return null;

  const mustChoose = !current;

  async function choose(name: string) {
    setBusyName(name);
    setError(null);
    try {
      const res = await fetch("/api/admin/whoami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("failed");
      try {
        sessionStorage.setItem("actingAsConfirmed", "1");
      } catch {}
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't save your name. Please try again.");
    } finally {
      setBusyName(null);
    }
  }

  return (
    <>
      {current && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-3 text-xs text-stone-600"
          style={{ border: "1px solid rgba(222,75,51,0.25)" }}
        >
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: ACCENT, color: CREAM, fontFamily: SERIF }}
          >
            {current.charAt(0).toUpperCase()}
          </span>
          <span>
            Acting as <b className="text-stone-900">{current}</b>
          </span>
          <span className="text-stone-400">· Switch</span>
        </button>
      )}

      {(open || mustChoose) && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6"
          style={{ backgroundColor: CREAM, animation: "actingFade 260ms ease-out" }}
        >
          <style>{`
            @keyframes actingFade{from{opacity:0}to{opacity:1}}
            @keyframes actingRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
          `}</style>

          {/* decorative crescent rings, same motif as the dashboard card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 420,
              height: 420,
              top: -190,
              right: -170,
              border: "14px solid rgba(222,75,51,0.12)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 300,
              height: 300,
              bottom: -140,
              left: -120,
              border: "12px solid rgba(222,75,51,0.09)",
            }}
          />

          <div
            className="relative flex w-full max-w-md flex-col items-center text-center"
            style={{ animation: "actingRise 340ms ease-out" }}
          >
            <p
              className="text-3xl"
              style={{ color: "rgba(222,75,51,0.85)", fontFamily: "'Caveat', cursive, Georgia, serif" }}
            >
              welcome
            </p>
            <h2
              className="mt-1 text-5xl font-medium leading-tight"
              style={{ color: ACCENT, fontFamily: SERIF, letterSpacing: "-0.03em" }}
            >
              Who&apos;s here?
            </h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(222,75,51,0.8)" }}>
              Tap your name. Every change you make gets signed with it.
            </p>

            <div className="mt-12 flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
              {names.map((n) => {
                const isCurrent = n === current;
                const isBusy = busyName === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={busyName !== null}
                    onClick={() => choose(n)}
                    className="group flex flex-col items-center gap-3 transition active:scale-95 disabled:opacity-60"
                  >
                    <span className="relative">
                      <span
                        className="flex h-28 w-28 items-center justify-center rounded-full transition group-hover:scale-105"
                        style={{
                          backgroundColor: ACCENT,
                          color: CREAM,
                          fontFamily: SERIF,
                          fontSize: 52,
                          boxShadow: isCurrent
                            ? "0 0 0 4px #FFF4E6, 0 0 0 7px #DE4B33"
                            : "0 12px 30px -10px rgba(0,0,0,0.35)",
                        }}
                      >
                        {isBusy ? "…" : n.charAt(0).toUpperCase()}
                      </span>
                      {isCurrent && (
                        <span
                          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: ACCENT, color: CREAM, boxShadow: "0 0 0 3px #FFF4E6" }}
                        >
                          ✓
                        </span>
                      )}
                    </span>
                    <span
                      className="text-xl font-medium"
                      style={{ color: ACCENT, fontFamily: SERIF }}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-8 rounded-full bg-white/90 px-4 py-2 text-sm" style={{ color: ACCENT }}>
                {error}
              </p>
            )}

            {!mustChoose && (
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem("actingAsConfirmed", "1");
                  } catch {}
                  setOpen(false);
                }}
                className="mt-12 text-sm underline-offset-4 hover:underline"
                style={{ color: "rgba(222,75,51,0.8)" }}
              >
                Not now
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
