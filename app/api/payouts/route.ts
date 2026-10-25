import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payoutSchema } from "@/lib/validators";
import { MIN_PAYOUT_NAIRA, toKobo } from "@/lib/pricing";
import { isListerRole, formatNaira } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";

// A lister asks to cash out everything that is currently available
// (earned, and past the hold period).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isListerRole(session.user.role)) {
    return NextResponse.json({ error: "Only landlords can withdraw." }, { status: 403 });
  }
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const parsed = payoutSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const verification = await prisma.verification.findUnique({ where: { userId: session.user.id } });
  if (verification?.status !== "APPROVED") {
    return NextResponse.json({ error: "Verify your identity before withdrawing." }, { status: 403 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const available = await tx.earning.findMany({
      where: { ownerId: session.user.id, status: "HELD", availableAt: { lte: new Date() } },
      select: { id: true, amountKobo: true },
    });
    const total = available.reduce((sum, e) => sum + e.amountKobo, 0);
    if (total < toKobo(MIN_PAYOUT_NAIRA)) return { tooLow: true as const, total };

    const payout = await tx.payoutRequest.create({
      data: { userId: session.user.id, amountKobo: total, ...parsed.data },
    });
    const claimed = await tx.earning.updateMany({
      where: { id: { in: available.map((e) => e.id) }, status: "HELD" },
      data: { status: "IN_PAYOUT", payoutId: payout.id },
    });
    if (claimed.count !== available.length) throw new Error("EARNINGS_CHANGED");

    return { tooLow: false as const, total, payoutId: payout.id };
  });

  if (result.tooLow) {
    return NextResponse.json(
      { error: `The minimum withdrawal is ₦${MIN_PAYOUT_NAIRA.toLocaleString()} of available earnings.` },
      { status: 400 }
    );
  }
  await notifyAdmins("Withdrawal requested", `${session.user.name} requested ${formatNaira(result.total)}.`, "/admin/payouts");
  return NextResponse.json({ success: true, payoutId: result.payoutId }, { status: 201 });
}
