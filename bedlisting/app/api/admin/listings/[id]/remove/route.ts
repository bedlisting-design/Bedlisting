import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { refundCredits } from "@/lib/credits";
import { notifyListingRemoved } from "@/lib/notify";

// "Remove scam listing": takes it down, cancels the lister's un-paid-out
// earnings from it, and refunds every user who paid to unlock it.
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const summary = await prisma.$transaction(async (tx) => {
    await tx.property.update({ where: { id: params.id }, data: { status: "REMOVED" } });

    const reversed = await tx.earning.updateMany({
      where: { propertyId: params.id, status: "HELD" },
      data: { status: "REVERSED" },
    });

    const unlocks = await tx.unlock.findMany({ where: { propertyId: params.id, refunded: false } });
    for (const u of unlocks) {
      await refundCredits(tx, u.userId, u.paidSpent, u.bonusSpent, "Listing removed by bedlisting", params.id);
      await tx.unlock.update({ where: { id: u.id }, data: { refunded: true } });
    }

    // Open escort requests are cancelled and refunded too.
    const escorts = await tx.escortRequest.findMany({
      where: { propertyId: params.id, status: { in: ["REQUESTED", "ACCEPTED"] } },
    });
    for (const e of escorts) {
      await refundCredits(tx, e.seekerId, e.paidSpent, e.bonusSpent, "Escort cancelled: listing removed", params.id);
      await tx.escortRequest.update({ where: { id: e.id }, data: { status: "CANCELLED" } });
    }

    return {
      refundedUsers: unlocks.length,
      reversedEarnings: reversed.count,
      refundedUserIds: [...unlocks.map((u) => u.userId), ...escorts.map((e) => e.seekerId)],
    };
  });

  const { refundedUserIds, ...counts } = summary;
  await notifyListingRemoved(params.id, Array.from(new Set(refundedUserIds)));
  return NextResponse.json({ success: true, ...counts });
}
