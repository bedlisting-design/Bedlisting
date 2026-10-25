import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { notifyAdmins } from "@/lib/notify";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const report = await prisma.report.create({
    data: {
      ...parsed.data,
      reporterId: session.user.id,
    },
  });

  await notifyAdmins("New report filed", `A user reported a listing or account (reason: ${parsed.data.reason}).`, "/admin/reports");
  return NextResponse.json(report, { status: 201 });
}
