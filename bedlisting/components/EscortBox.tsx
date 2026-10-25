"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Existing = { id: string; status: string; preferredTime: string } | null;

const statusText: Record<string, string> = {
  REQUESTED: "Waiting for the agent to respond.",
  ACCEPTED: "The agent accepted. Mark it complete after the visit.",
  DECLINED: "The agent declined. Your bedcoins were returned.",
  CANCELLED: "Cancelled. Your bedcoins were returned.",
  COMPLETED: "Completed.",
};

export default function EscortBox({
  propertyId,
  cost,
  existing,
}: {
  propertyId: string;
  cost: number;
  existing: Existing;
}) {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function request() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/escort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, preferredTime: time, note: note || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send the request.");
      return;
    }
    window.dispatchEvent(new Event("bedcoins:changed"));
    router.refresh();
  }

  async function act(action: "CANCEL" | "COMPLETE") {
    await fetch(`/api/escort/${existing!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    window.dispatchEvent(new Event("bedcoins:changed"));
    router.refresh();
  }

  const open = existing && ["REQUESTED", "ACCEPTED"].includes(existing.status);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-medium">Get taken there by the agent</h3>

      {existing && (
        <div className="mt-2 text-sm text-neutral-700">
          <p>
            Your request ({existing.preferredTime}): {statusText[existing.status]}
          </p>
          {existing.status === "REQUESTED" && (
            <button onClick={() => act("CANCEL")} className="mt-2 text-red-600 underline">
              Cancel and get bedcoins back
            </button>
          )}
          {existing.status === "ACCEPTED" && (
            <button
              onClick={() => act("COMPLETE")}
              className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-white"
            >
              Mark visit complete
            </button>
          )}
        </div>
      )}

      {!open && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-neutral-600">
            The agent meets you at the property. Costs {cost} bedcoins, held until the
            agent responds and returned if they decline.
          </p>
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Preferred day and time"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the agent should know (optional)"
            rows={2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={request}
            disabled={loading || time.trim().length < 3}
            className="w-full rounded-md border border-brand-600 py-2 text-sm text-brand-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : `Request escort (${cost} bedcoins)`}
          </button>
        </div>
      )}
    </div>
  );
}
