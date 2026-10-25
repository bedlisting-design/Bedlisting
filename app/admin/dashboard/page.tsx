import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [userCount, listingCount, messageCount, pendingListings, pendingVerifications, openReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.message.count(),
      prisma.property.count({ where: { status: "PENDING" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

  const stats = [
    { label: "Total users", value: userCount },
    { label: "Total listings", value: listingCount },
    { label: "Total messages", value: messageCount },
  ];

  const queues = [
    { label: "Listings awaiting review", value: pendingListings, href: "/admin/listings" },
    { label: "Verifications awaiting review", value: pendingVerifications, href: "/admin/users" },
    { label: "Open reports", value: openReports, href: "/admin/reports" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Admin overview</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-semibold">Needs your attention</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {queues.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">{q.label}</p>
            <p className={`text-2xl font-semibold ${q.value > 0 ? "text-red-600" : ""}`}>
              {q.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
