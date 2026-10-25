import { COIN_VALUE_SCALE } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { notifyPurchase } from "@/lib/notify";

/**
 * Credits a Paystack payment, exactly once.
 * Called from the webhook AND from the page the buyer returns to, so credits
 * arrive even if one of them is delayed. Safe to call repeatedly.
 *
 * Checks: payment exists on our side, Paystack says "success", amount and
 * currency match what WE stored, and the PENDING -> PAID flip is atomic.
 */
export async function fulfilPayment(reference: string) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return { ok: false as const, reason: "unknown_reference" };
  if (payment.status === "PAID") return { ok: true as const, already: true };

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false as const, reason: "paystack_not_configured" };

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" }
  );
  const json = await res.json().catch(() => null);
  const data = json?.data;

  if (!res.ok || !json?.status || data?.status !== "success") {
    return { ok: false as const, reason: "not_successful" };
  }

  if (data.amount !== payment.amountKobo || data.currency !== "NGN") {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    console.error("Paystack amount mismatch", reference, data.amount, payment.amountKobo);
    return { ok: false as const, reason: "amount_mismatch" };
  }

  const credited = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (claimed.count === 0) return false; // already credited by the other path

    const buyer = await tx.user.findUniqueOrThrow({
      where: { id: payment.userId },
      select: { creditBalance: true, paidCoinValueKobo: true },
    });
    const newBalance = buyer.creditBalance + payment.credits;
    // Stored as kobo-per-bedcoin x COIN_VALUE_SCALE (see lib/pricing.ts) so nothing is lost to rounding.
    const newValue = Math.round(
      (buyer.creditBalance * buyer.paidCoinValueKobo + payment.amountKobo * COIN_VALUE_SCALE) / newBalance
    );
    await tx.user.update({
      where: { id: payment.userId },
      data: { creditBalance: { increment: payment.credits }, paidCoinValueKobo: newValue },
    });
    await tx.creditTransaction.create({
      data: {
        userId: payment.userId,
        type: "PURCHASE",
        paidDelta: payment.credits,
        note: `Bought ${payment.credits} credits (${payment.packageId})`,
      },
    });
    return true;
  });

  if (credited) await notifyPurchase(payment.id);

  return { ok: true as const, already: false };
}
