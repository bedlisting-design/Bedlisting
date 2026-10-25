"use client";

import { useState } from "react";

export default function ReportButton({
  propertyId,
  reportedUserId,
  person = false,
}: {
  propertyId?: string;
  reportedUserId?: string;
  person?: boolean; // reporting a person (roommates) instead of a listing
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("scam");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, reportedUserId, reason, details }),
    });
    setDone(true);
  }

  if (done) {
    return <p className="text-sm text-neutral-500">Report submitted. Thank you.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 underline"
      >
        {person ? "Report this person" : "Report this listing"}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded border border-neutral-300 px-2 py-1"
      >
        <option value="scam">Scam</option>
        {!person && <option value="fake_listing">Fake listing</option>}
        {!person && <option value="misleading_details">Misleading details (amenities, photos, price)</option>}
        <option value="harassment">Harassment</option>
        <option value="other">Other</option>
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Optional details"
        rows={2}
        className="mt-2 w-full rounded border border-neutral-300 px-2 py-1"
      />
      <button
        onClick={submit}
        className="mt-2 rounded bg-red-600 px-3 py-1 text-white"
      >
        Submit report
      </button>
    </div>
  );
}
