import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roommateMessageSchema } from "@/lib/validators";
import { requireVerifiedEmail } from "@/lib/emailGate";
import { notifyRoommateMessage } from "@/lib/notify";

async function loadConnection(id: string, userId: string) {
  const c = await prisma.roommateConnection.findUnique({ where: { id } });
  // Only the two people involved, and only once the request was accepted.
  if (!c || (c.requesterId !== userId && c.targetId !== userId)) return null;
  return c;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const c = await loadConnection(params.id, session.user.id);
  if (!c || c.status !== "ACCEPTED") return NextResponse.json({ error: "Not found." }, { status: 404 });

  const messages = await prisma.roommateMessage.findMany({
    where: { connectionId: c.id },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: { id: true, content: true, createdAt: true, senderId: true },
  });
  return NextResponse.json(
    messages.map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt, mine: m.senderId === session.user.id }))
  );
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const c = await loadConnection(params.id, session.user.id);
  if (!c || c.status !== "ACCEPTED") return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = roommateMessageSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Write a message (up to 1000 characters)." }, { status: 400 });

  const message = await prisma.roommateMessage.create({
    data: { connectionId: c.id, senderId: session.user.id, content: parsed.data.content.trim() },
  });
  await notifyRoommateMessage(c.id, session.user.id);
  return NextResponse.json({ id: message.id }, { status: 201 });
}
