import { Prisma } from "@prisma/client";
import { earningKobo, EARNING_HOLD_DAYS } from "@/lib/pricing";

export type Tx = Prisma.TransactionClient;

export class InsufficientCreditsError extends Error {
  constructor() {
    super("INSUFFICIENT_CREDITS");
  }
}

/**
 * Takes `cost` credits from a user inside an existing transaction.
 * Free (bonus) credits are used first. The conditional updateMany means two
 * simultaneous requests can never push a balance below zero.
 */
export async function spendCredits(tx: Tx, userId: string, cost: number) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true, bonusBalance: true, paidCoinValueKobo: true },
  });
  if (!user || user.creditBalance + user.bonusBalance < cost) {
    throw new InsufficientCreditsError();
  }

  const bonusSpent = Math.min(user.bonusBalance, cost);
  const paidSpent = cost - bonusSpent;

  const updated = await tx.user.updateMany({
    where: {
      id: userId,
      creditBalance: { gte: paidSpent },
      bonusBalance: { gte: bonusSpent },
    },
    data: {
      creditBalance: { decrement: paidSpent },
      bonusBalance: { decrement: bonusSpent },
    },
  });
  if (updated.count === 0) throw new InsufficientCreditsError();

  return { paidSpent, bonusSpent, coinValueKobo: user.paidCoinValueKobo };
}

/** Gives credits back (used for refunds). */
export async function refundCredits(
  tx: Tx,
  userId: string,
  paidSpent: number,
  bonusSpent: number,
  note: string,
  propertyId?: string
) {
  await tx.user.update({
    where: { id: userId },
    data: {
      creditBalance: { increment: paidSpent },
      bonusBalance: { increment: bonusSpent },
    },
  });
  await tx.creditTransaction.create({
    data: {
      userId,
      type: "REFUND",
      paidDelta: paidSpent,
      bonusDelta: bonusSpent,
      note,
      propertyId,
    },
  });
}

/**
 * Creates the lister's 40% share. Only PAID credits earn money, so free
 * sign-up credits can't be farmed through fake accounts.
 */
export async function createEarning(
  tx: Tx,
  args: {
    ownerId: string;
    propertyId: string;
    paidSpent: number;
    coinValueKobo: number;
    unlockId?: string;
    escortId?: string;
  }
) {
  if (args.paidSpent <= 0) return null;
  const availableAt = new Date(Date.now() + EARNING_HOLD_DAYS * 24 * 60 * 60 * 1000);
  return tx.earning.create({
    data: {
      ownerId: args.ownerId,
      propertyId: args.propertyId,
      unlockId: args.unlockId,
      escortId: args.escortId,
      amountKobo: earningKobo(args.paidSpent, args.coinValueKobo),
      availableAt,
    },
  });
}

/** Sums earnings for a lister into pending / available / in payout / paid out. */
export async function earningsSummary(prisma: { earning: any }, ownerId: string) {
  const now = new Date();
  const rows: { status: string; availableAt: Date; amountKobo: number }[] =
    await prisma.earning.findMany({
      where: { ownerId, status: { not: "REVERSED" } },
      select: { status: true, availableAt: true, amountKobo: true },
    });

  const s = { pending: 0, available: 0, inPayout: 0, paidOut: 0 };
  for (const r of rows) {
    if (r.status === "HELD") {
      if (r.availableAt <= now) s.available += r.amountKobo;
      else s.pending += r.amountKobo;
    } else if (r.status === "IN_PAYOUT") s.inPayout += r.amountKobo;
    else if (r.status === "PAID_OUT") s.paidOut += r.amountKobo;
  }
  return s;
}
