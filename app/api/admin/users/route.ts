import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      agencyName: true,
      licenseNumber: true,
      createdAt: true,
      verification: { select: { status: true, idType: true } },
      _count: { select: { reportsAgainst: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
