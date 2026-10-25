import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVerifiedEmail } from "@/lib/emailGate";
import { compatibility } from "@/lib/roommates";
import { ROOMMATE_CONNECT_COST, ROOMMATE_REQUESTS_PER_DAY } from "@/lib/pricing";
import { spendCredits, InsufficientCreditsError } from "@/lib/credits";
import { notifyRoommate } from "@/lib/notify";

// Ask someone to be roommates. Costs bedcoins, returned if they decline, you cancel,
// or they do not answer in time.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const { targetUserId } = await req.json().catch(() => ({}));
  const me = session.user.id;
  if (typeof targetUserId !== "string" || targetUserId === me) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [mine, theirs] = await Promise.all([
    prisma.roommateProfile.findUnique({ where: { userId: me } }),
    prisma.roommateProfile.findUnique({ where: { userId: targetUserId } }),
  ]);
  if (!mine || !mine.active) {
    return NextResponse.json({ error: "Create your roommate profile first." }, { status: 400 });
  }
  if (!theirs || !theirs.active) {
    return NextResponse.json({ error: "That profile is no longer available." }, { status: 404 });
  }
  // The same rules as the match list, enforced here too so they can't be skipped.
  if (!compatibility(mine, theirs).ok) {
    return NextResponse.json({ error: "You are not a match for this person." }, { status: 400 });
  }

  const existing = await prisma.roommateConnection.findMany({
    where: { OR: [{ requesterId: me, targetId: targetUserId }, { requesterId: targetUserId, targetId: me }] },
  });
  if (existing.some((c) => c.status === "ACCEPTED")) {
    return NextResponse.json({ error: "You are already connected." }, { status: 409 });
  }
  if (existing.some((c) => c.requesterId === targetUserId && c.status === "PENDING")) {
    return NextResponse.json({ error: "They already sent you a request. Open Connections to accept it." }, { status: 409 });
  }
  if (existing.some((c) => c.requesterId === me && (c.status === "PENDING" || c.status === "DECLINED"))) {
    return NextResponse.json({ error: "You have already sent this person a request." }, { status: 409 });
  }

  const sentToday = await prisma.roommateConnection.count({
    where: { requesterId: me, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (sentToday >= ROOMMATE_REQUESTS_PER_DAY) {
    return NextResponse.json({ error: "You have reached today's limit of requests. Try again tomorrow." }, { status: 429 });
  }

  try {
    const connection = await prisma.$transaction(async (tx) => {
      const { paidSpent, bonusSpent } = await spendCredits(tx, me, ROOMMATE_CONNECT_COST);
      await tx.creditTransaction.create({
        data: {
          userId: me,
          type: "ROOMMATE_SPEND",
          paidDelta: -paidSpent,
          bonusDelta: -bonusSpent,
          note: "Roommate request",
        },
      });
      return tx.roommateConnection.create({
        data: { requesterId: me, targetId: targetUserId, cost: ROOMMATE_CONNECT_COST, paidSpent, bonusSpent },
      });
    });
    await notifyRoommate("REQUESTED", connection.id);
    return NextResponse.json({ id: connection.id }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `You need ${ROOMMATE_CONNECT_COST} bedcoins to send a request.`, needCredits: ROOMMATE_CONNECT_COST },
        { status: 402 }
      );
    }
    console.error("Roommate connect error:", err);
    return NextResponse.json({ error: "Could not send the request." }, { status: 500 });
  }
}
