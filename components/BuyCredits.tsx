"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreditPackage } from "@/lib/pricing";

export default function BuyCredits({ packages }: { packages: CreditPackage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Back from Paystack: confirm the payment and add the bedcoins.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    setMessage("Confirming your payment...");
    fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`)
      .then((r) => r.json())
      .then((d) => {
        setMessage(
          d.ok
            ? "Payment confirmed. Your bedcoins have been added."
            : "We could not confirm that payment yet. If you were charged, your bedcoins will appear shortly."
        );
        window.dispatchEvent(new Event("bedcoins:changed"));
        window.history.replaceState(null, "", "/credits");
        router.refresh();
      })
      .catch(() => setMessage("Could not confirm the payment. Refresh in a moment."));
  }, [router]);

  async function buy(id: string) {
    setBusy(id);
    setMessage("");
    const res = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setBusy(null);
      setMessage(data.error || "Could not start the payment.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold">Buy bedcoins</h2>
      {message && (
        <p className="mb-3 rounded bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {packages.map((p) => (
          <button
            key={p.id}
            onClick={() => buy(p.id)}
            disabled={busy !== null}
            className="rounded-lg border border-neutral-200 bg-white p-4 text-left hover:border-brand-600 disabled:opacity-50"
          >
            <p className="text-sm text-neutral-500">{p.label}</p>
            <p className="text-xl font-semibold">{p.credits} bedcoins</p>
            <p className="text-sm text-neutral-700">₦{p.priceNaira.toLocaleString()}</p>
            {busy === p.id && <p className="mt-1 text-xs text-neutral-500">Redirecting to Paystack...</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
