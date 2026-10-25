"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type ConnectState = "none" | "sent" | "received" | "connected" | "declined";

export default function ConnectButton({
  targetUserId,
  cost,
  state,
  connectionId,
}: {
  targetUserId: string;
  cost: number;
  state: ConnectState;
  connectionId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needCoins, setNeedCoins] = useState(false);

  if (state === "connected") {
    return (
      <Link href={`/roommates/connections/${connectionId}`} className="block rounded-full bg-brand-600 py-2 text-center text-sm font-semibold text-white">
        Open chat
      </Link>
    );
  }
  if (state === "received") {
    return (
      <Link href="/roommates/connections" className="block rounded-full border border-brand-600 py-2 text-center text-sm font-semibold text-brand-700">
        They asked to connect. Review
      </Link>
    );
  }
  if (state === "sent") return <p className="text-center text-sm text-neutral-500">Request sent. Waiting for a reply.</p>;
  if (state === "declined") return <p className="text-center text-sm text-neutral-500">Not available.</p>;

  async function connect() {
    setLoading(true);
    setError("");
    setNeedCoins(false);
    const res = await fetch("/api/roommates/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 402) setNeedCoins(true);
    if (!res.ok) {
      setError(data.error || "Could not send the request.");
      return;
    }
    window.dispatchEvent(new Event("bedcoins:changed"));
    router.refresh();
  }

  return (
    <div>
      <button onClick={connect} disabled={loading}
        className="w-full rounded-full bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Sending..." : `Connect (${cost} bedcoins)`}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {needCoins && <Link href="/credits" className="mt-1 block text-xs text-brand-700 underline">Buy bedcoins</Link>}
      <p className="mt-2 text-center text-[11px] text-neutral-500">Returned if they decline or do not reply.</p>
    </div>
  );
}
