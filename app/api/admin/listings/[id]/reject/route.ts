import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { notifyListingDecision } from "@/lib/notify";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.remove ? "REMOVED" : "REJECTED";

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { status },
  });

  if (status === "REJECTED") await notifyListingDecision(params.id, "REJECTED");
  return NextResponse.json(updated);
}
