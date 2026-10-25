import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validators";
import { redactProperty } from "@/lib/access";
import { isOurVideoUrl } from "@/lib/cloudinary";
import { notifyAdmins } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";
import { isListerRole } from "@/lib/format";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") || undefined;
  const city = searchParams.get("city") || undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const bedrooms = searchParams.get("bedrooms");
  const furnished = searchParams.get("furnished");
  const listingType = searchParams.get("listingType");

  const properties = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      state,
      city,
      rent: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      furnished: furnished ? furnished === "true" : undefined,
      listingType:
        listingType === "RENT" || listingType === "SALE" ? listingType : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      landlord: {
        select: {
          role: true,
          verification: { select: { status: true } },
        },
      },
    },
  });

  // The public list never includes interior photos or exact locations.
  return NextResponse.json(properties.map((x) => redactProperty(x, false)));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const isAdmin = session?.user.role === "ADMIN";
  if (!session || (!isListerRole(session.user.role) && !isAdmin)) {
    return NextResponse.json(
      { error: "Only landlords and agents can list properties." },
      { status: 403 }
    );
  }

  // The email address must be confirmed before anything can be published.
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  // Verification gate. This is the rule that matters most: a landlord
  // cannot publish a listing until an admin has approved their ID.
  const verification = isAdmin
    ? null
    : await prisma.verification.findUnique({ where: { userId: session.user.id } });

  if (!isAdmin && (!verification || verification.status !== "APPROVED")) {
    return NextResponse.json(
      {
        error:
          "Your account must be verified before you can list a property. Submit your ID for review first.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  if (parsed.data.videos.some((v) => !isOurVideoUrl(v))) {
    return NextResponse.json({ error: "Videos must be uploaded through bedlisting." }, { status: 400 });
  }

  const { latitude, longitude } = parsed.data;
  if ((latitude == null) !== (longitude == null)) {
    return NextResponse.json(
      { error: "Provide both latitude and longitude, or neither." },
      { status: 400 }
    );
  }

  const property = await prisma.property.create({
    data: {
      ...parsed.data,
      landlordId: session.user.id,
      // The "Verified property" badge is only ever set by an admin who has
      // actually looked at the ownership document (see the approve route).
      // Admins post official listings: live at once, tagged Official, and the admin
      // decides whether to mark the property verified. Everyone else waits for review.
      verifiedProperty: isAdmin ? body?.verifiedProperty === true : false,
      status: isAdmin ? "APPROVED" : "PENDING",
      isOfficial: isAdmin,
    },
  });

  if (!isAdmin) await notifyAdmins("New listing awaiting review", `${session.user.name} submitted \"${property.title}\".`, "/admin/listings");
  return NextResponse.json(property, { status: 201 });
}
