"use client";

import { useState } from "react";

function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Instagram|FBAN|FBAV|FB_IAB|TikTok|Line\//i.test(navigator.userAgent);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  // fallback for browsers that block the clipboard API
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function EmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  async function handleClick() {
    const ok = await copyText(email);

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    // Instagram / Facebook browsers can't open mail apps: show the address instead
    if (isInAppBrowser()) {
      setShowEmail(true);
      return;
    }

    window.location.href = `mailto:${email}`;
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-medium uppercase tracking-[0.08em] transition-transform duration-300 hover:-translate-y-1 sm:w-auto md:text-[13px]"
        style={{ backgroundColor: "#47684b", color: "#FFF4E6" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        {copied ? "Email copied ✓" : "Email us"}
      </button>

      {showEmail && (
        <p className="text-center text-sm" style={{ color: "#000000" }}>
          {copied ? "Copied! " : ""}Our email:{" "}
          <span className="select-all font-semibold">{email}</span>
        </p>
      )}
    </div>
  );
}