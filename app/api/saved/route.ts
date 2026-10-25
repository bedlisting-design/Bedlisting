import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const saved = await prisma.savedProperty.findMany({
    where: { userId: session.user.id },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { propertyId } = await req.json();
  const saved = await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
    update: {},
    create: { userId: session.user.id, propertyId },
  });

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { propertyId } = await req.json();
  await prisma.savedProperty.delete({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
  });

  return NextResponse.json({ success: true });
}
