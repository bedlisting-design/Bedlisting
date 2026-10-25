import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UNLOCK_COST } from "@/lib/pricing";
import { spendCredits, createEarning, InsufficientCreditsError } from "@/lib/credits";
import { notifyEarning } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Log in to unlock this property." }, { status: 401 });
  }

  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      id: true, landlordId: true, status: true, listingType: true,
      landlord: { select: { role: true } },
    },
  });
  if (!property || property.status !== "APPROVED") {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  if (property.landlordId === session.user.id) {
    return NextResponse.json({ error: "This is your own listing." }, { status: 400 });
  }

  const cost = UNLOCK_COST[property.listingType];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Unique (userId, propertyId) also blocks a double-click double-charge.
      const existing = await tx.unlock.findUnique({
        where: { userId_propertyId: { userId: session.user.id, propertyId: property.id } },
      });
      if (existing) return { alreadyUnlocked: !existing.refunded, refunded: existing.refunded };

      const { paidSpent, bonusSpent, coinValueKobo } = await spendCredits(tx, session.user.id, cost);

      const unlock = await tx.unlock.create({
        data: { userId: session.user.id, propertyId: property.id, cost, paidSpent, bonusSpent },
      });

      await tx.creditTransaction.create({
        data: {
          userId: session.user.id,
          type: "UNLOCK_SPEND",
          paidDelta: -paidSpent,
          bonusDelta: -bonusSpent,
          propertyId: property.id,
          note: "Unlocked full view",
        },
      });

      // 40% of the PAID credits go to the lister (60% stays with bedlisting).
      // Listings posted by bedlisting itself have no lister to pay: the platform keeps it all.
      const earning = property.landlord.role !== "ADMIN" ? await createEarning(tx, {
        ownerId: property.landlordId,
        propertyId: property.id,
        paidSpent,
        coinValueKobo,
        unlockId: unlock.id,
      }) : null;

      return { alreadyUnlocked: false, earnedKobo: earning?.amountKobo ?? 0 };
    });

    if ((result as any).refunded) {
      return NextResponse.json({ error: "This listing is no longer available." }, { status: 410 });
    }
    const earnedKobo = (result as { earnedKobo?: number }).earnedKobo ?? 0;
    if (earnedKobo > 0) await notifyEarning(property.landlordId, property.id, earnedKobo);
    return NextResponse.json({ success: true, alreadyUnlocked: result.alreadyUnlocked });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `You need ${cost} bedcoins to unlock this property.`, needCredits: cost },
        { status: 402 }
      );
    }
    if ((err as any)?.code === "P2002") {
      return NextResponse.json({ success: true, alreadyUnlocked: true });
    }
    console.error("Unlock error:", err);
    return NextResponse.json({ error: "Could not unlock. Try again." }, { status: 500 });
  }
}
