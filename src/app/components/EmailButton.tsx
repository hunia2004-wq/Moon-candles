"use client";

import { useState } from "react";

export default function EmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    // copy the email first, so the customer has it even if no mail app opens
    navigator.clipboard
      ?.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {});

    // then open their mail app with our address filled in
    window.location.href = `mailto:${email}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-medium uppercase tracking-[0.08em] transition-transform duration-300 hover:-translate-y-1 sm:w-auto md:text-[13px]"
      style={{ backgroundColor: "#FFF4E6", color: "#47684b" }}
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
  );
}