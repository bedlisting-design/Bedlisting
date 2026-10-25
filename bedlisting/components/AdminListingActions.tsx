"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminListingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function feature(days: number) {
    setError("");
    const res = await fetch(`/api/properties/${id}/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not feature the listing.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Take this listing down?")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
      <Link href={`/admin/properties/${id}/edit`} className="text-brand-700 underline">Edit</Link>
      {status === "APPROVED" && (
        <button onClick={() => setOpen(!open)} className="text-brand-700 underline">Feature (free)</button>
      )}
      {status !== "REMOVED" && (
        <button onClick={remove} className="text-red-600 underline">Remove</button>
      )}
      {open && (
        <span className="flex gap-2">
          {[3, 7, 14].map((d) => (
            <button key={d} onClick={() => feature(d)} className="rounded border border-neutral-300 px-2 py-0.5">
              {d} days
            </button>
          ))}
        </span>
      )}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
