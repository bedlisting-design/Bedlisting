import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escortSchema } from "@/lib/validators";
import { ESCORT_COST } from "@/lib/pricing";
import { hasFullAccess } from "@/lib/access";
import { spendCredits, InsufficientCreditsError } from "@/lib/credits";
import { notifyEscort } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";

// A seeker pays credits to have the listing agent take them to the property.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const parsed = escortSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    include: { landlord: { select: { id: true, role: true } } },
  });
  if (!property || property.status !== "APPROVED") {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  if (property.landlord.role !== "AGENT") {
    return NextResponse.json({ error: "Escorts are only offered by agents." }, { status: 400 });
  }
  if (property.landlordId === session.user.id) {
    return NextResponse.json({ error: "This is your own listing." }, { status: 400 });
  }
  if (!(await hasFullAccess(session.user.id, property))) {
    return NextResponse.json({ error: "Unlock the property first." }, { status: 402 });
  }

  const open = await prisma.escortRequest.findFirst({
    where: {
      propertyId: property.id,
      seekerId: session.user.id,
      status: { in: ["REQUESTED", "ACCEPTED"] },
    },
  });
  if (open) {
    return NextResponse.json({ error: "You already have an open escort request." }, { status: 409 });
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      const { paidSpent, bonusSpent, coinValueKobo } = await spendCredits(tx, session.user.id, ESCORT_COST);
      await tx.creditTransaction.create({
        data: {
          userId: session.user.id,
          type: "ESCORT_SPEND",
          paidDelta: -paidSpent,
          bonusDelta: -bonusSpent,
          propertyId: property.id,
          note: "Agent escort request",
        },
      });
      return tx.escortRequest.create({
        data: {
          propertyId: property.id,
          seekerId: session.user.id,
          listerId: property.landlordId,
          cost: ESCORT_COST,
          paidSpent,
          bonusSpent,
          coinValueKobo,
          preferredTime: parsed.data.preferredTime,
          note: parsed.data.note,
        },
      });
    });
    await notifyEscort("REQUESTED", request.id);
    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `You need ${ESCORT_COST} bedcoins to request an escort.`, needCredits: ESCORT_COST },
        { status: 402 }
      );
    }
    console.error("Escort error:", err);
    return NextResponse.json({ error: "Could not create the request." }, { status: 500 });
  }
}
