import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKAGES } from "@/lib/pricing";
import BuyCredits from "@/components/BuyCredits";

export default async function CreditsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [user, history] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditBalance: true, bonusBalance: true },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Your bedcoins</h1>
      <p className="mb-6 text-sm text-neutral-500">
        bedcoins are credits used inside bedlisting. They are not cryptocurrency.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Purchased</p>
          <p className="text-2xl font-semibold">{user?.creditBalance ?? 0}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Free</p>
          <p className="text-2xl font-semibold">{user?.bonusBalance ?? 0}</p>
        </div>
      </div>

      <BuyCredits packages={CREDIT_PACKAGES} />

      <h2 className="mb-2 mt-8 font-semibold">Recent activity</h2>
      {history.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing yet.</p>
      ) : (
        <div className="space-y-1">
          {history.map((h) => {
            const delta = h.paidDelta + h.bonusDelta;
            return (
              <div key={h.id} className="flex justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-sm">
                <span>{h.note ?? h.type}</span>
                <span className={delta >= 0 ? "text-brand-700" : "text-neutral-600"}>
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
