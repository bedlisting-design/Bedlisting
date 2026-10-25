"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  agencyName: string | null;
  licenseNumber: string | null;
  verification: { status: string; idType: string } | null;
  _count: { reportsAgainst: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSuspend(id: string) {
    await fetch(`/api/admin/users/${id}/suspend`, { method: "PATCH" });
    load();
  }

  async function viewId(id: string) {
    const res = await fetch(`/api/admin/users/${id}/id-document`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.open(data.url, "_blank", "noopener");
    else alert(data.error || "Could not open the document.");
  }

  async function reviewVerification(id: string, decision: "APPROVED" | "REJECTED") {
    await fetch(`/api/admin/users/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    load();
  }

  if (loading) return <p className="text-neutral-500">Loading users...</p>;

  const pendingLandlords = users.filter(
    (u) => (u.role === "LANDLORD" || u.role === "AGENT") && u.verification?.status === "PENDING"
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>

      {pendingLandlords.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-semibold text-yellow-700">
            Verification queue ({pendingLandlords.length})
          </h2>
          <div className="space-y-2">
            {pendingLandlords.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4"
              >
                <div>
                  <p className="font-medium">
                    {u.name} <span className="text-xs text-neutral-400">({u.role})</span>
                  </p>
                  <p className="text-sm text-neutral-500">{u.email}</p>
                  <p className="text-sm text-neutral-500">
                    ID type: {u.verification?.idType}
                    {u.agencyName && ` · ${u.agencyName}`}
                    {u.licenseNumber && ` · Licence ${u.licenseNumber}`}
                  </p>
                  <button onClick={() => viewId(u.id)} className="mt-1 text-sm text-brand-700 underline">
                    View ID document (10-minute link)
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => reviewVerification(u.id, "APPROVED")}
                    className="rounded bg-brand-600 px-3 py-1 text-sm text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewVerification(u.id, "REJECTED")}
                    className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 font-semibold">All users</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div>
              <p className="font-medium">
                {u.name}{" "}
                <span className="text-xs text-neutral-400">({u.role})</span>
                {u._count.reportsAgainst > 0 && (
                  <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    {u._count.reportsAgainst} report(s)
                  </span>
                )}
              </p>
              <p className="text-sm text-neutral-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-1 text-xs ${
                  u.status === "ACTIVE"
                    ? "bg-brand-50 text-brand-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {u.status}
              </span>
              <button
                onClick={() => toggleSuspend(u.id)}
                className="rounded border border-neutral-300 px-3 py-1 text-sm"
              >
                {u.status === "ACTIVE" ? "Suspend" : "Reinstate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
