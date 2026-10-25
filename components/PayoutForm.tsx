"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayoutForm({
  availableKobo,
  minNaira,
  verified,
}: {
  availableKobo: number;
  minNaira: number;
  verified: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const enough = availableKobo >= minNaira * 100;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not request the withdrawal.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (!verified) {
    return (
      <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        Verify your identity to withdraw earnings.
      </p>
    );
  }
  if (done) {
    return (
      <p className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
        Withdrawal requested. We will pay it to your bank account and update the status here.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="font-semibold">Withdraw to your bank</h2>
      <p className="text-sm text-neutral-500">
        Minimum ₦{minNaira.toLocaleString()}. The account name must match your verified name.
      </p>
      <input required placeholder="Bank name" value={form.bankName}
        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <input required placeholder="Account number (10 digits)" value={form.accountNumber}
        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <input required placeholder="Account name" value={form.accountName}
        onChange={(e) => setForm({ ...form, accountName: e.target.value })}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading || !enough}
        className="w-full rounded-md bg-brand-600 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {enough ? "Request withdrawal" : `Available earnings are below ₦${minNaira.toLocaleString()}`}
      </button>
    </form>
  );
}
