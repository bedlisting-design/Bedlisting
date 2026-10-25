import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Either party in a thread can opt in to sharing contact details.
// Once one side opts in, all messages on that property thread between
// the two of them are marked contactShared so both names/emails unmask.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { propertyId, otherUserId } = await req.json();
  if (!propertyId || !otherUserId) {
    return NextResponse.json(
      { error: "propertyId and otherUserId are required." },
      { status: 400 }
    );
  }

  await prisma.message.updateMany({
    where: {
      propertyId,
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
    },
    data: { contactShared: true },
  });

  return NextResponse.json({ success: true });
}
