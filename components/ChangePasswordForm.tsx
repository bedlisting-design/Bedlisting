"use client";

import { useState } from "react";

export default function ChangePasswordForm({ minLength }: { minLength: number }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setOk(res.ok);
    setMsg(res.ok ? "Password changed." : data.error || "Could not change the password.");
    if (res.ok) setForm({ currentPassword: "", newPassword: "" });
  }

  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input required type="password" autoComplete="current-password" placeholder="Current password"
        value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={input} />
      <input required type="password" autoComplete="new-password" placeholder={`New password (at least ${minLength} characters)`}
        value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={input} />
      {msg && <p className={`text-sm ${ok ? "text-brand-700" : "text-red-600"}`}>{msg}</p>}
      <button disabled={loading} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        {loading ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
