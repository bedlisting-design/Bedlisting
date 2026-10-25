import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") || "REQUESTED";
  const payouts = await prisma.payoutRequest.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true, role: true, verification: { select: { status: true } } } },
    },
  });
  return NextResponse.json(payouts);
}
