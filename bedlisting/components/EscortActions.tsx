"use client";

import { useRouter } from "next/navigation";

export default function EscortActions({ id }: { id: string }) {
  const router = useRouter();

  async function act(action: "ACCEPT" | "DECLINE") {
    await fetch(`/api/escort/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button onClick={() => act("ACCEPT")} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
        Accept
      </button>
      <button onClick={() => act("DECLINE")} className="rounded border border-neutral-300 px-3 py-1 text-sm">
        Decline
      </button>
    </div>
  );
}
