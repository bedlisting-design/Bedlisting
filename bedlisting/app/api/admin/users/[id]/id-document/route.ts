import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { signedUrlFromStoredUrl } from "@/lib/cloudinary";

// Admin-only: a 10-minute signed link to a user's private ID document.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const v = await prisma.verification.findUnique({ where: { userId: params.id } });
  if (!v) return NextResponse.json({ error: "No document submitted." }, { status: 404 });

  const url = signedUrlFromStoredUrl(v.idDocumentUrl);
  if (!url) return NextResponse.json({ error: "Could not create a link." }, { status: 500 });
  return NextResponse.json({ url, idType: v.idType });
}
