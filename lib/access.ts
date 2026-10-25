import { prisma } from "@/lib/prisma";

/**
 * Who may see the full listing (all photos, exact address/pin, directions)?
 * The lister themself, or a user who has paid to unlock it.
 * Admins review listings on the admin site and don't use this path.
 */
export async function hasFullAccess(
  userId: string | undefined,
  property: { id: string; landlordId: string }
) {
  if (!userId) return false;
  if (userId === property.landlordId) return true;
  const unlock = await prisma.unlock.findUnique({
    where: { userId_propertyId: { userId, propertyId: property.id } },
    select: { id: true, refunded: true },
  });
  return !!unlock && !unlock.refunded;
}

/** Strips everything a non-unlocked viewer must not receive. */
export function redactProperty<T extends Record<string, any>>(p: T, full: boolean) {
  // The ownership document is for admins only, whoever is asking.
  if (full) return { ...p, ownershipDocUrl: null };
  return {
    ...p,
    photos: p.photos?.slice(0, 1) ?? [],
    exteriorPhotos: [],
    photoCount: (p.photos?.length ?? 0) + (p.exteriorPhotos?.length ?? 0),
    // Who the lister is stays hidden until paid: only their type and verified status show.
    landlord: p.landlord ? { role: p.landlord.role, verification: p.landlord.verification } : p.landlord,
    videos: [],
    videoCount: p.videos?.length ?? 0,
    address: null,
    latitude: null,
    longitude: null,
    plusCode: null,
    landmarkDirections: null,
    ownershipDocUrl: null,
  };
}
