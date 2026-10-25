import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundCredits, createEarning } from "@/lib/credits";
import { notifyEscort } from "@/lib/notify";

// Lister: ACCEPT / DECLINE.   Seeker: CANCEL (before accepted) / COMPLETE (after accepted).
// Credits are held from the moment of the request:
//   DECLINE / CANCEL -> refunded in full
//   COMPLETE         -> lister earns 40% of the paid credits (held 7 days), bedlisting keeps 60%
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  const er = await prisma.escortRequest.findUnique({ where: { id: params.id } });
  if (!er) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  const isLister = er.listerId === session.user.id;
  const isSeeker = er.seekerId === session.user.id;

  const transitions: Record<string, { by: boolean; from: string; to: string }> = {
    ACCEPT: { by: isLister, from: "REQUESTED", to: "ACCEPTED" },
    DECLINE: { by: isLister, from: "REQUESTED", to: "DECLINED" },
    CANCEL: { by: isSeeker, from: "REQUESTED", to: "CANCELLED" },
    COMPLETE: { by: isSeeker, from: "ACCEPTED", to: "COMPLETED" },
  };
  const t = transitions[String(action)];
  if (!t) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  if (!t.by) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const done = await prisma.$transaction(async (tx) => {
    // Only flips if the request is still in the expected state.
    const flipped = await tx.escortRequest.updateMany({
      where: { id: er.id, status: t.from as any },
      data: { status: t.to as any },
    });
    if (flipped.count === 0) return false;

    if (t.to === "DECLINED" || t.to === "CANCELLED") {
      await refundCredits(tx, er.seekerId, er.paidSpent, er.bonusSpent, "Escort request refunded", er.propertyId);
    }
    if (t.to === "COMPLETED") {
      await createEarning(tx, {
        ownerId: er.listerId,
        propertyId: er.propertyId,
        paidSpent: er.paidSpent,
        coinValueKobo: er.coinValueKobo,
        escortId: er.id,
      });
    }
    return true;
  });

  if (!done) {
    return NextResponse.json({ error: "This request was already updated." }, { status: 409 });
  }
  await notifyEscort(t.to as "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED", er.id);
  return NextResponse.json({ success: true, status: t.to });
}
