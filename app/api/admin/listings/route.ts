import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { signedVideoUrl } from "@/lib/cloudinary";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const listings = await prisma.property.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "asc" },
    include: {
      landlord: {
        select: { name: true, email: true, verification: { select: { status: true } } },
      },
    },
  });

  // Admins review videos too, so they get playable links.
  return NextResponse.json(
    listings.map((l) => ({ ...l, videos: l.videos.map(signedVideoUrl).filter(Boolean) }))
  );
}
