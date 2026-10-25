"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectionActions({ id, kind }: { id: string; kind: "received" | "sent" }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function act(action: "ACCEPT" | "DECLINE" | "CANCEL") {
    setError("");
    const res = await fetch(`/api/roommates/connections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Something went wrong.");
    }
    window.dispatchEvent(new Event("bedcoins:changed"));
    router.refresh();
  }

  return (
    <div className="mt-3">
      {kind === "received" ? (
        <div className="flex gap-2">
          <button onClick={() => act("ACCEPT")} className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white">Accept</button>
          <button onClick={() => act("DECLINE")} className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm">Decline</button>
        </div>
      ) : (
        <button onClick={() => act("CANCEL")} className="text-sm text-red-600 underline">Cancel and get bedcoins back</button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
