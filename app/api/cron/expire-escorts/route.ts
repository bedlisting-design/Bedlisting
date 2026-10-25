import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";
import { notifyEscort, notifyRoommate } from "@/lib/notify";
import { ROOMMATE_REQUEST_EXPIRES_HOURS } from "@/lib/pricing";

const EXPIRE_AFTER_HOURS = 72;

// Runs daily (see vercel.json). Escort requests an agent never answers are
// cancelled and the bedcoins go back to the seeker, so they are never stuck.
// Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - EXPIRE_AFTER_HOURS * 60 * 60 * 1000);
  const stale = await prisma.escortRequest.findMany({
    where: { status: "REQUESTED", createdAt: { lt: cutoff } },
  });

  let expired = 0;
  for (const e of stale) {
    const done = await prisma.$transaction(async (tx) => {
      const flipped = await tx.escortRequest.updateMany({
        where: { id: e.id, status: "REQUESTED" },
        data: { status: "CANCELLED" },
      });
      if (flipped.count === 0) return false;
      await refundCredits(tx, e.seekerId, e.paidSpent, e.bonusSpent, "Escort request expired, bedcoins returned", e.propertyId);
      return true;
    });
    if (done) {
      expired += 1;
      await notifyEscort("EXPIRED", e.id);
    }
  }
  // Roommate requests nobody answered also go back to the sender.
  const rmCutoff = new Date(Date.now() - ROOMMATE_REQUEST_EXPIRES_HOURS * 60 * 60 * 1000);
  const rmStale = await prisma.roommateConnection.findMany({ where: { status: "PENDING", createdAt: { lt: rmCutoff } } });
  let roommateExpired = 0;
  for (const c of rmStale) {
    const done = await prisma.$transaction(async (tx) => {
      const flipped = await tx.roommateConnection.updateMany({
        where: { id: c.id, status: "PENDING" },
        data: { status: "CANCELLED", respondedAt: new Date() },
      });
      if (flipped.count === 0) return false;
      await refundCredits(tx, c.requesterId, c.paidSpent, c.bonusSpent, "Roommate request expired, bedcoins returned");
      return true;
    });
    if (done) {
      roommateExpired += 1;
      await notifyRoommate("EXPIRED", c.id);
    }
  }
  return NextResponse.json({ expired, roommateExpired });
}
