"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";

type Payout = {
  id: string;
  amountKobo: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  user: { name: string; email: string; role: string; verification: { status: string } | null };
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/payouts?status=REQUESTED");
    if (res.ok) setPayouts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markPaid(id: string) {
    const reference = prompt("Enter the bank transfer reference after you have paid:");
    if (!reference) return;
    await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "PAID", reference }),
    });
    load();
  }

  async function reject(id: string) {
    const note = prompt("Reason for rejecting (the earnings return to the lister's balance):") ?? "";
    await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT", note }),
    });
    load();
  }

  if (loading) return <p className="text-neutral-500">Loading payouts...</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Withdrawal requests ({payouts.length})</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Pay the exact amount to the account below, check the account name matches the verified
        name, then mark it paid with the transfer reference.
      </p>

      {payouts.length === 0 ? (
        <p className="text-neutral-500">No pending withdrawals.</p>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-start justify-between rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-sm">
                <p className="text-lg font-semibold">{formatNaira(p.amountKobo)}</p>
                <p>
                  {p.user.name} ({p.user.role.toLowerCase()}) · {p.user.email} ·{" "}
                  <span className={p.user.verification?.status === "APPROVED" ? "text-brand-700" : "text-red-600"}>
                    {p.user.verification?.status ?? "not verified"}
                  </span>
                </p>
                <p className="mt-1">
                  {p.bankName} · {p.accountNumber} · {p.accountName}
                </p>
                <p className="text-xs text-neutral-400">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => markPaid(p.id)} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                  Mark paid
                </button>
                <button onClick={() => reject(p.id)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
