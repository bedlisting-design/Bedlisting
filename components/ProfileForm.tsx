"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  name: string;
  phone: string | null;
  bio: string | null;
  agencyName: string | null;
  licenseNumber: string | null;
  emailNotifications: boolean;
};

export default function ProfileForm({ initial, isAgent }: { initial: Initial; isAgent: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone ?? "",
    bio: initial.bio ?? "",
    agencyName: initial.agencyName ?? "",
    licenseNumber: initial.licenseNumber ?? "",
    emailNotifications: initial.emailNotifications,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Saved." : data.error || "Could not save.");
    if (res.ok) router.refresh();
  }

  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

  return (
    <form onSubmit={save} className="space-y-3">
      <input className={input} placeholder="Full name" required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={input} placeholder="Phone (never shown publicly)" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <textarea className={input} rows={3} placeholder="About you" value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      {isAgent && (
        <>
          <input className={input} placeholder="Agency / company name" value={form.agencyName}
            onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
          <input className={input} placeholder="Licence / registration number" value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
        </>
      )}
      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="mt-1" checked={form.emailNotifications}
          onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} />
        <span>
          Email me about new messages, escort updates and earnings. (Important emails, such as ID
          results, withdrawals and receipts, are always sent.)
        </span>
      </label>
      {msg && <p className="text-sm text-neutral-600">{msg}</p>}
      <button disabled={loading} className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
