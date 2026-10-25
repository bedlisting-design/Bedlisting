"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function EmailVerifyBanner() {
  const { data: session } = useSession();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const user = session?.user;
  if (!user || user.role === "ADMIN" || user.emailVerified !== false) return null;

  async function resend() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/email/resend", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "Link sent. Check your inbox and spam." : d.error || "Could not send the link.");
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900">
      Confirm your email to unlock listings, message people and buy bedcoins. We sent a link to{" "}
      <strong>{user.email}</strong>.{" "}
      <button onClick={resend} disabled={busy} className="font-semibold underline disabled:opacity-50">
        Resend
      </button>
      {msg && <span className="ml-2">{msg}</span>}
    </div>
  );
}
