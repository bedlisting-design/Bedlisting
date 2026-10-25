import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validators";
import { hasFullAccess } from "@/lib/access";
import { SUPPORT_EMAIL } from "@/lib/site";
import { notifyNewMessage } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";

function maskName(fullName: string) {
  const parts = fullName.trim().split(" ");
  const first = parts[0];
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return `${first} ${lastInitial}`.trim();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, landlordId: true, status: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const senderIsLister = session.user.id === property.landlordId;

  if (senderIsLister) {
    // Listers can only reply to someone who has unlocked the property.
    const receiverUnlocked = await hasFullAccess(parsed.data.receiverId, property);
    if (!receiverUnlocked) {
      return NextResponse.json({ error: "That user has not unlocked this property." }, { status: 403 });
    }
  } else {
    // Seekers message the real lister only, and only after paying to unlock.
    if (parsed.data.receiverId !== property.landlordId) {
      return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
    }
    if (property.status !== "APPROVED" || !(await hasFullAccess(session.user.id, property))) {
      return NextResponse.json(
        { error: "Unlock this property to contact the owner.", needUnlock: true },
        { status: 402 }
      );
    }
  }

  const message = await prisma.message.create({
    data: {
      propertyId: parsed.data.propertyId,
      receiverId: parsed.data.receiverId,
      senderId: session.user.id,
      content: parsed.data.content,
    },
  });

  await notifyNewMessage({ propertyId: message.propertyId, senderId: message.senderId, receiverId: message.receiverId });
  return NextResponse.json(message, { status: 201 });
}

// Thread for a given property between the current user and the other party.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required." }, { status: 400 });
  }

  // A listing can have many interested people, so a thread is "me and one other person".
  const otherUserId = searchParams.get("otherUserId");
  const me = session.user.id;

  const messages = await prisma.message.findMany({
    where: {
      propertyId,
      OR: otherUserId
        ? [
            { senderId: me, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: me },
          ]
        : [{ senderId: me }, { receiverId: me }],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Mask identity until contact has been mutually shared on this thread.
  const anyShared = messages.some((m) => m.contactShared);

  const shaped = messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    senderId: m.senderId,
    isSelf: m.senderId === session.user.id,
    senderDisplay: m.sender.role === "ADMIN" ? "bedlisting team" : anyShared ? m.sender.name : maskName(m.sender.name),
    // Admins share the support address, never a personal one.
    senderContact: anyShared ? (m.sender.role === "ADMIN" ? SUPPORT_EMAIL : m.sender.email) : null,
  }));

  return NextResponse.json(shaped);
}
