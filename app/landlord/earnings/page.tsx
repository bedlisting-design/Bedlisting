import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { earningsSummary } from "@/lib/credits";
import { formatNaira } from "@/lib/format";
import { MIN_PAYOUT_NAIRA, OWNER_SHARE, EARNING_HOLD_DAYS } from "@/lib/pricing";
import PayoutForm from "@/components/PayoutForm";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [summary, verification, recent, payouts] = await Promise.all([
    earningsSummary(prisma, session.user.id),
    prisma.verification.findUnique({ where: { userId: session.user.id } }),
    prisma.earning.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { property: { select: { title: true } } },
    }),
    prisma.payoutRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const tile = (label: string, kobo: number) => (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-xl font-semibold">{formatNaira(kobo)}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Your earnings</h1>
      <p className="mb-6 text-sm text-neutral-500">
        You earn {Math.round(OWNER_SHARE * 100)}% of what people pay to unlock your listings.
        Earnings are held for {EARNING_HOLD_DAYS} days, then become available to withdraw.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {tile("Available now", summary.available)}
        {tile("Pending (in hold)", summary.pending)}
        {tile("Withdrawal requested", summary.inPayout)}
        {tile("Paid out", summary.paidOut)}
      </div>

      <PayoutForm
        availableKobo={summary.available}
        minNaira={MIN_PAYOUT_NAIRA}
        verified={verification?.status === "APPROVED"}
      />

      <h2 className="mb-2 mt-8 font-semibold">Recent earnings</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing yet. You earn when a user spends bedcoins to unlock one of your listings.
        </p>
      ) : (
        <div className="space-y-1">
          {recent.map((e) => (
            <div key={e.id} className="flex justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-sm">
              <span>
                {e.property?.title ?? "Listing"}{" "}
                <span className="text-xs text-neutral-400">{e.status}</span>
              </span>
              <span>{formatNaira(e.amountKobo)}</span>
            </div>
          ))}
        </div>
      )}

      {payouts.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-semibold">Withdrawals</h2>
          <div className="space-y-1">
            {payouts.map((p) => (
              <div key={p.id} className="flex justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-sm">
                <span>
                  {p.createdAt.toLocaleDateString()} · {p.status}
                  {p.reference && <span className="text-xs text-neutral-400"> · ref {p.reference}</span>}
                </span>
                <span>{formatNaira(p.amountKobo)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
