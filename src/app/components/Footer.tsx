"use client";

import { useState } from "react";

export default function EmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  async function handleClick() {
    // copy the email first, so the customer always has it
    try {
      await navigator.clipboard?.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard can be blocked; the options below still work
    }
    // let the customer pick an app instead of forcing a mail app that
    // may not be installed (that is what made the old button do nothing)
    setShowOptions(true);
  }

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  const mailtoHref = `mailto:${email}`;

  const optionClass =
    "rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-transform duration-300 hover:-translate-y-0.5";

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
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

      {showOptions && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className={optionClass}
            style={{ borderColor: "#FFF4E6", color: "#FFF4E6" }}
          >
            Open Gmail
          </a>
          <a
            href={mailtoHref}
            className={optionClass}
            style={{ borderColor: "#FFF4E6", color: "#FFF4E6" }}
          >
            Other mail app
          </a>
        </div>
      )}
    </div>
  );
}