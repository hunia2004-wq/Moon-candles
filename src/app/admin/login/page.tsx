"use client";

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

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: "#FFF4E6" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ border: "1.5px solid rgba(0,0,0,0.12)", backgroundColor: "#FFF9F0" }}
      >
        <p className="uppercase tracking-[0.25em] text-xs mb-2" style={{ color: "#DE4B33" }}>
          moon candles
        </p>
        <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: "#000000" }}>
          Owner sign in
        </h1>

        <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF" }}
        />

        <label className="block text-xs font-semibold mb-1" style={{ color: "#000000" }}>
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ border: "1.5px solid rgba(0,0,0,0.15)", backgroundColor: "#FFFFFF" }}
        />

        {error && (
          <p className="mb-4 text-sm" style={{ color: "#B23A26" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full py-3 text-sm font-medium transition-colors disabled:opacity-60"
          style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}