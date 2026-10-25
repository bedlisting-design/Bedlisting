"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOST_OPTIONS } from "@/lib/pricing";

export default function BoostButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function boost(days: number) {
    setError("");
    const res = await fetch(`/api/properties/${propertyId}/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not boost.");
      return;
    }
    window.dispatchEvent(new Event("bedcoins:changed"));
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="text-sm text-brand-700 underline">
        Feature this listing
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {BOOST_OPTIONS.map((o) => (
            <button
              key={o.days}
              onClick={() => boost(o.days)}
              className="rounded border border-neutral-300 px-3 py-1 text-sm hover:border-brand-600"
            >
              {o.days} days · {o.cost} bedcoins
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
