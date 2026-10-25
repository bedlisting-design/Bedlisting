import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyVerifyEmail } from "@/lib/notify";

// "Resend": at most one link a minute and five an hour, so it can't be used to spam an inbox.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } });
  if (user?.emailVerified) return NextResponse.json({ alreadyVerified: true });

  const key = `verify:${session.user.id}`;
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const minuteAgo = new Date(Date.now() - 60 * 1000);
  const [lastHour, lastMinute] = await Promise.all([
    prisma.notificationLog.count({ where: { userId: session.user.id, key, createdAt: { gte: hourAgo } } }),
    prisma.notificationLog.count({ where: { userId: session.user.id, key, createdAt: { gte: minuteAgo } } }),
  ]);
  if (lastMinute > 0) {
    return NextResponse.json({ error: "Please wait a minute before asking for another link." }, { status: 429 });
  }
  if (lastHour >= 5) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  await prisma.notificationLog.create({ data: { userId: session.user.id, key } });
  await notifyVerifyEmail(session.user.id);
  return NextResponse.json({ sent: true });
}
