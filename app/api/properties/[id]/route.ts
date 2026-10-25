import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertyEditSchema } from "@/lib/validators";
import { hasFullAccess, redactProperty } from "@/lib/access";
import { isOurVideoUrl, signedVideoUrl } from "@/lib/cloudinary";
import { notifyAdmins } from "@/lib/notify";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          role: true,
          verification: { select: { status: true } },
        },
      },
    },
  });

  const isOwner = !!session && property?.landlordId === session.user.id;
  if (!property || (property.status !== "APPROVED" && !isOwner)) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const full = await hasFullAccess(session?.user.id, property);
  const out: any = redactProperty(property, full);
  // Playable links are made only for people who unlocked (or own) the listing.
  if (full) out.videos = property.videos.map(signedVideoUrl).filter(Boolean);
  return NextResponse.json(out);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  if (property.landlordId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = propertyEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // A listing an admin or the owner removed stays removed: it must not be
  // brought back by editing it.
  if (property.status === "REMOVED") {
    return NextResponse.json({ error: "This listing was removed and cannot be edited." }, { status: 409 });
  }

  const d = parsed.data;
  if (d.videos?.some((v) => !isOurVideoUrl(v))) {
    return NextResponse.json({ error: "Videos must be uploaded through bedlisting." }, { status: 400 });
  }
  const lat = d.latitude === undefined ? property.latitude : d.latitude;
  const lng = d.longitude === undefined ? property.longitude : d.longitude;
  if ((lat == null) !== (lng == null)) {
    return NextResponse.json({ error: "Provide both latitude and longitude, or neither." }, { status: 400 });
  }

  // Changes that could mislead someone who has not paid yet, or who already
  // has (photos, price, place, ownership proof), send the listing back for
  // review. Smaller fixes (amenities, description, rooms) go live at once.
  const changed = (a: unknown, b: unknown) => b !== undefined && JSON.stringify(a) !== JSON.stringify(b);
  const needsReview =
    changed(property.title, d.title) ||
    changed(property.photos, d.photos) ||
    changed(property.exteriorPhotos, d.exteriorPhotos) ||
    changed(property.videos, d.videos) ||
    changed(property.rent, d.rent) ||
    changed(property.listingType, d.listingType) ||
    changed(property.state, d.state) ||
    changed(property.city, d.city) ||
    changed(property.address, d.address) ||
    changed(property.latitude, d.latitude) ||
    changed(property.longitude, d.longitude) ||
    changed(property.plusCode, d.plusCode) ||
    changed(property.ownershipDocUrl, d.ownershipDocUrl);

  const isAdmin = session.user.role === "ADMIN";
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      ...d,
      // Rejected or pending listings are resubmitted; approved ones only go back if needed.
      status: isAdmin
        ? property.status
        : needsReview || property.status !== "APPROVED"
        ? "PENDING"
        : "APPROVED",
      verifiedProperty: isAdmin
        ? typeof body?.verifiedProperty === "boolean"
          ? body.verifiedProperty
          : property.verifiedProperty
        : needsReview
        ? false
        : property.verifiedProperty,
    },
  });

  if (!isAdmin && updated.status === "PENDING") {
    await notifyAdmins("Listing resubmitted for review", `\"${updated.title}\" was edited and needs a new review.`, "/admin/listings");
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  if (property.landlordId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  // Soft delete: listings with paid views, earnings or messages must keep
  // their history, so we hide the listing instead of erasing it.
  await prisma.property.update({ where: { id: params.id }, data: { status: "REMOVED" } });
  return NextResponse.json({ success: true });
}
