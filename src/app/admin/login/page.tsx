"use client";

import { LOGO_URL, LOGO_SIZE } from "@/lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Confirm this signed-in user is one of the two owners.
    const { data: allowed } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", data.user?.email)
      .maybeSingle();

    if (!allowed) {
      await supabase.auth.signOut();
      setError("This account isn't authorized for the admin panel.");
      setLoading(false);
      return;
    }

    try { sessionStorage.removeItem("actingAsConfirmed"); } catch {}
    router.push("/admin");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-full px-5 py-3.5 text-base outline-none transition focus:border-[#DE4B33] focus:ring-2 focus:ring-[#DE4B33]/25";
  const inputStyle: React.CSSProperties = {
    border: "1.5px solid rgba(0,0,0,0.15)",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  };
  const labelClass =
    "mb-2 block px-2 text-[11px] font-semibold uppercase tracking-[0.15em]";

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ backgroundColor: "#FFF4E6" }}
    >
      {/* Arch card with a double red border */}
      <div
        className="w-full max-w-[380px] rounded-t-[200px] rounded-b-[36px] border-2 p-2"
        style={{
          backgroundColor: "#FFF4E6",
          borderColor: "#DE4B33",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          className="rounded-t-[200px] rounded-b-[29px] border px-7 pb-9 pt-16 sm:px-9"
          style={{ borderColor: "#DE4B3380", backgroundColor: "#FFF4E6" }}
        >
          <div className="flex flex-col items-center">
            <img
              src={LOGO_URL}
              alt="Moon Candles"
              className={`${LOGO_SIZE.login} -my-4`}
            />

            <h1
              className="mt-5 text-center font-serif text-3xl font-bold"
              style={{ color: "#000000" }}
            >
              Owner sign in
            </h1>
            <p
              className="mb-8 mt-2 text-center text-sm"
              style={{ color: "rgba(0,0,0,0.6)" }}
            >
              Welcome back to the Moon admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <label htmlFor="email" className={labelClass} style={{ color: "#000000" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mb-5`}
              style={inputStyle}
            />

            <label htmlFor="password" className={labelClass} style={{ color: "#000000" }}>
              Password
            </label>
            <div className="relative mb-6">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-12`}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 transition hover:opacity-100"
                style={{ color: "#000000" }}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 text-center text-sm font-medium"
                style={{ color: "#DE4B33" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3.5 text-sm font-semibold transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}