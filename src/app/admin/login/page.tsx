"use client";

import { LOGO_URL, LOGO_SIZE } from "@/lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-8 py-10"
      style={{ backgroundColor: "#FFF4E6" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <img
          src={LOGO_URL}
          alt="Moon Candles"
          className={`${LOGO_SIZE.login} -my-4`}
        />

        <h1
          className="mt-4 mb-10 text-center font-serif text-3xl font-bold"
          style={{ color: "#000000" }}
        >
          Owner sign in
        </h1>

        <form onSubmit={handleSubmit} className="w-full">
          <label
            className="mb-2 block px-2 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "black" }}
          >
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 w-full rounded-full px-5 py-3.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          />

          <label
            className="mb-2 block px-2 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "black" }}
          >
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-7 w-full rounded-full px-5 py-3.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF", color: "#000000" }}
          />

          {error && (
            <p className="mb-4 text-center text-sm" style={{ color: "#B23A26" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3.5 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
