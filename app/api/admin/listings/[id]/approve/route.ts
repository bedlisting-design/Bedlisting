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
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      // "Verified property" only when the admin ticked it AND a document exists.
      verifiedProperty: !!body?.verifyProperty && !!property.ownershipDocUrl,
    },
  });

  await notifyListingDecision(params.id, "APPROVED");
  return NextResponse.json(updated);
}
