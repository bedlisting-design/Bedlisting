"use client";

import { useEffect, useState } from "react";

type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string; email: string };
  reportedUser: { id: string; name: string; email: string } | null;
  property: { id: string; title: string } | null;
  reportedUserTotalReports: number;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/reports?status=OPEN");
    if (res.ok) {
      const data: AdminReport[] = await res.json();
      // Repeat offenders surfaced first: this is the strongest scam signal
      // available without deeper investigation.
      data.sort((a, b) => b.reportedUserTotalReports - a.reportedUserTotalReports);
      setReports(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (loading) return <p className="text-neutral-500">Loading reports...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Open reports ({reports.length})</h1>

      {reports.length === 0 ? (
        <p className="text-neutral-500">No open reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {r.reason.replace("_", " ")}
                    {r.reportedUserTotalReports > 1 && (
                      <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                        {r.reportedUserTotalReports} total reports against this user
                      </span>
                    )}
                  </p>
                  {r.details && (
                    <p className="mt-1 text-sm text-neutral-600">{r.details}</p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    Reported by {r.reporter.name} ({r.reporter.email})
                    {r.reportedUser && (
                      <> against {r.reportedUser.name} ({r.reportedUser.email})</>
                    )}
                    {r.property && <> · listing: {r.property.title}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(r.id, "RESOLVED")}
                    className="rounded bg-brand-600 px-3 py-1 text-sm text-white"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "DISMISSED")}
                    className="rounded border border-neutral-300 px-3 py-1 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
