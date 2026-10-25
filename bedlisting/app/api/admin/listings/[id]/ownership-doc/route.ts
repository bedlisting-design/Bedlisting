import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { signedUrlFromStoredUrl } from "@/lib/cloudinary";

// Admin-only: signed link to a listing's ownership document. Older listings
// uploaded to the public folder fall back to their stored URL.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const p = await prisma.property.findUnique({
    where: { id: params.id },
    select: { ownershipDocUrl: true },
  });
  if (!p?.ownershipDocUrl) return NextResponse.json({ error: "No document." }, { status: 404 });

  const isPrivate = p.ownershipDocUrl.includes("/authenticated/");
  const url = isPrivate ? signedUrlFromStoredUrl(p.ownershipDocUrl) : p.ownershipDocUrl;
  if (!url) return NextResponse.json({ error: "Could not create a link." }, { status: 500 });
  return NextResponse.json({ url });
}
