import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "OPEN";

  const reports = await prisma.report.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { name: true, email: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
  });

  // Repeat reports against the same landlord are the strongest scam
  // signal available in v1, so surface those counts alongside each report.
  const counts = await prisma.report.groupBy({
    by: ["reportedUserId"],
    where: { reportedUserId: { not: null } },
    _count: true,
  });
  const countMap = Object.fromEntries(
    counts.map((c) => [c.reportedUserId, c._count])
  );

  const shaped = reports.map((r) => ({
    ...r,
    reportedUserTotalReports: r.reportedUserId
      ? countMap[r.reportedUserId] || 0
      : 0,
  }));

  return NextResponse.json(shaped);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!["REVIEWING", "RESOLVED", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
