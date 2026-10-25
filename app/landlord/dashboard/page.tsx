import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import BoostButton from "@/components/BoostButton";

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-red-700",
  REMOVED: "bg-neutral-100 text-neutral-500",
};

export default async function LandlordDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [verification, properties, interestCount] = await Promise.all([
    prisma.verification.findUnique({ where: { userId: session.user.id } }),
    prisma.property.findMany({
      where: { landlordId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { unlocks: true } } },
    }),
    prisma.message.count({
      where: { receiverId: session.user.id },
    }),
  ]);

  const isVerified = verification?.status === "APPROVED";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your dashboard</h1>
        <Link
          href="/landlord/properties/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Add property
        </Link>
      </div>

      {!isVerified && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {verification?.status === "PENDING" ? (
            <p>Your ID is under review. You can list a property once it&apos;s approved.</p>
          ) : verification?.status === "REJECTED" ? (
            <p>
              Your verification was rejected.{" "}
              <Link href="/landlord/verification" className="underline">
                Resubmit your ID
              </Link>
              .
            </p>
          ) : (
            <p>
              You need to verify your identity before listing a property.{" "}
              <Link href="/landlord/verification" className="underline">
                Submit your ID now
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <div className="mb-4 flex gap-4 text-sm">
        <Link href="/landlord/earnings" className="text-brand-700 underline">Earnings and withdrawals</Link>
        {session.user.role === "AGENT" && (
          <Link href="/landlord/escorts" className="text-brand-700 underline">Escort requests</Link>
        )}
        <Link href="/credits" className="text-brand-700 underline">My bedcoins</Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Total listings</p>
          <p className="text-2xl font-semibold">{properties.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Messages received</p>
          <p className="text-2xl font-semibold">{interestCount}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Verification status</p>
          <p className="text-lg font-semibold">
            {verification?.status || "Not submitted"}
          </p>
        </div>
      </div>

      <h2 className="mb-3 font-semibold">Your listings</h2>
      {properties.length === 0 ? (
        <p className="text-neutral-500">You haven&apos;t listed a property yet.</p>
      ) : (
        <div className="space-y-2">
          {properties.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-neutral-500">
                  {p.city}, {p.state} · {formatPrice(p)} · {p._count.unlocks} paid view{p._count.unlocks === 1 ? "" : "s"}
                </p>
                {p.status !== "REMOVED" && (
                  <Link href={`/landlord/properties/${p.id}/edit`} className="mt-1 inline-block text-sm text-brand-700 underline">
                    Edit listing
                  </Link>
                )}
                {p.status === "APPROVED" && <BoostButton propertyId={p.id} />}
              </div>
              <span className={`rounded px-2 py-1 text-xs ${statusColor[p.status]}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
