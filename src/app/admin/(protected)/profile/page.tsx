"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notice = { kind: "ok" | "error"; text: string } | null;

// Set NEXT_PUBLIC_SITE_URL in .env.local and in Vercel (for example
// https://your-site.vercel.app). It makes sure the confirmation link
// opens your live site, not localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const inputStyle = {
  border: "1.5px solid rgba(0,0,0,0.15)",
  backgroundColor: "#FFFFFF",
  color: "#000000",
};

export default function AdminProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailNotice, setEmailNotice] = useState<Notice>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setCurrentEmail(data.user?.email ?? "");
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confirms the password is right before allowing a sensitive change
  async function verifyPassword(password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    });
    return !error;
  }

  async function saveEmail() {
    setEmailNotice(null);

    const trimmed = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailNotice({ kind: "error", text: "Enter a valid email address." });
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailNotice({ kind: "error", text: "That's already your email." });
      return;
    }
    if (!emailPassword) {
      setEmailNotice({ kind: "error", text: "Enter your current password." });
      return;
    }

    setSavingEmail(true);

    if (!(await verifyPassword(emailPassword))) {
      setSavingEmail(false);
      setEmailNotice({ kind: "error", text: "Current password is incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      SITE_URL ? { emailRedirectTo: `${SITE_URL}/admin` } : undefined
    );

    setSavingEmail(false);
    if (error) {
      setEmailNotice({ kind: "error", text: error.message });
      return;
    }

    setNewEmail("");
    setEmailPassword("");
    setEmailNotice({
      kind: "ok",
      text: "Check your inbox and click the confirmation link. Your login email changes after that.",
    });
  }

  async function savePassword() {
    setPasswordNotice(null);

    if (!currentPassword) {
      setPasswordNotice({ kind: "error", text: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({
        kind: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ kind: "error", text: "New passwords don't match." });
      return;
    }

    setSavingPassword(true);

    if (!(await verifyPassword(currentPassword))) {
      setSavingPassword(false);
      setPasswordNotice({ kind: "error", text: "Current password is incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setSavingPassword(false);
    if (error) {
      setPasswordNotice({ kind: "error", text: error.message });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordNotice({ kind: "ok", text: "Password updated." });
  }

  async function signOut(scope: "local" | "global") {
    await supabase.auth.signOut({ scope });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) {
    return <p style={{ color: "#000000" }}>Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold" style={{ color: "#000000" }}>
        Profile
      </h1>
      <p className="mb-8 text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>
        Signed in as <span className="font-semibold">{currentEmail}</span>
      </p>

      <div className="flex flex-col gap-6">
        {/* EMAIL */}
        <Card title="Change email">
          <Input
            label="New email"
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="new@example.com"
          />
          <Input
            label="Current password"
            type="password"
            value={emailPassword}
            onChange={setEmailPassword}
          />
          <NoticeText notice={emailNotice} />
          <SaveButton onClick={saveEmail} saving={savingEmail} label="Change email" />
        </Card>

        {/* PASSWORD */}
        <Card title="Change password">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <NoticeText notice={passwordNotice} />
          <SaveButton
            onClick={savePassword}
            saving={savingPassword}
            label="Change password"
          />
        </Card>

        {/* SIGN OUT */}
        <Card title="Sign out">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => signOut("local")}
              className="flex-1 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ backgroundColor: "#EFE3C4", color: "#000000" }}
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => signOut("global")}
              className="flex-1 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ border: "1.5px solid #DE4B33", color: "#DE4B33" }}
            >
              Sign out on all devices
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{ border: "1.5px solid rgba(0,0,0,0.1)", backgroundColor: "#FFFDF8" }}
    >
      <h2
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "#DE4B33" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-xs font-semibold uppercase tracking-wide"
        style={{ color: "rgba(0,0,0,0.6)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={inputStyle}
      />
    </div>
  );
}

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role="alert"
      className="text-sm font-medium"
      style={{ color: notice.kind === "ok" ? "#47684b" : "#DE4B33" }}
    >
      {notice.text}
    </p>
  );
}

function SaveButton({
  onClick,
  saving,
  label,
}: {
  onClick: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="w-full rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-60"
      style={{ backgroundColor: "#DE4B33", color: "#FFF4E6" }}
    >
      {saving ? "Saving..." : label}
    </button>
  );
}