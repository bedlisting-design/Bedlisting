import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";
import { notifyRoommate } from "@/lib/notify";

// The other person: ACCEPT or DECLINE.  The sender: CANCEL (only while it is still pending).
// Declined and cancelled requests return the sender's bedcoins; accepted ones keep them.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  const c = await prisma.roommateConnection.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  const isTarget = c.targetId === session.user.id;
  const isRequester = c.requesterId === session.user.id;
  const map: Record<string, { allowed: boolean; to: "ACCEPTED" | "DECLINED" | "CANCELLED" }> = {
    ACCEPT: { allowed: isTarget, to: "ACCEPTED" },
    DECLINE: { allowed: isTarget, to: "DECLINED" },
    CANCEL: { allowed: isRequester, to: "CANCELLED" },
  };
  const t = map[String(action)];
  if (!t) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  if (!t.allowed) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const done = await prisma.$transaction(async (tx) => {
    // Only flips if still pending, so a double click or a race cannot refund twice.
    const flipped = await tx.roommateConnection.updateMany({
      where: { id: c.id, status: "PENDING" },
      data: { status: t.to, respondedAt: new Date() },
    });
    if (flipped.count === 0) return false;
    if (t.to !== "ACCEPTED") {
      await refundCredits(tx, c.requesterId, c.paidSpent, c.bonusSpent, "Roommate request refunded");
    }
    return true;
  });
  if (!done) return NextResponse.json({ error: "This request was already answered." }, { status: 409 });

  if (t.to !== "CANCELLED") await notifyRoommate(t.to, c.id);
  return NextResponse.json({ success: true, status: t.to });
}
