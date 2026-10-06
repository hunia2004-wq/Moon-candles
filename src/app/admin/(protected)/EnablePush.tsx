"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "unsupported" | "idle" | "working" | "on" | "denied" | "error";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function EnablePush() {
  const [status, setStatus] = useState<Status>("loading");
const [detail, setDetail] = useState("");
  useEffect(() => {
    async function init() {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        typeof Notification !== "undefined";

      if (!supported) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub && Notification.permission === "granted" ? "on" : "idle");
      } catch {
        setStatus("idle");
      }
    }

    init();
  }, []);

  async function enable() {
    setStatus("working");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "idle");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.ok) {
  setStatus("on");
} else {
  setDetail(`server answered ${res.status}`);
  setStatus("error");
}
    } catch (err) {
     console.error("Enable push failed:", err);
setDetail(err instanceof Error ? err.message : String(err));
setStatus("error");
    }
  }

  if (status === "loading") return null;

  const box = "mb-6 rounded-2xl px-4 py-3 text-xs";

  if (status === "on") {
    return (
      <div className={box} style={{ backgroundColor: "#FFFFFF", color: "#47684b" }}>
        🔔 Order alerts are on for this device.
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className={box} style={{ backgroundColor: "#FFFFFF", color: "rgba(0,0,0,0.65)" }}>
        To get order alerts on iPhone: tap Share in Safari, then Add to Home Screen, and open
        Moon Admin from your Home Screen.
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className={box} style={{ backgroundColor: "#FBEAE7", color: "#C0392B" }}>
        Notifications are blocked. Turn them on in iPhone Settings → Notifications → Moon Admin.
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={enable}
        disabled={status === "working"}
        className="rounded-full px-5 py-2.5 text-xs font-semibold"
        style={{ backgroundColor: "#8FAA82", color: "#FFFFFF" }}
      >
        {status === "working" ? "Enabling..." : "🔔 Enable order alerts"}
      </button>

      {status === "error" && (
        <p className="mt-2 text-[11px]" style={{ color: "#C0392B" }}>
          Something went wrong{detail ? `: ${detail}` : ""}. Try again.
        </p>
      )}
    </div>
  );
}