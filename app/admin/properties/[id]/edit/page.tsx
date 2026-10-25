import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";

// Admins can edit any listing (their own official ones or a landlord's).
export default async function AdminEditPropertyPage({ params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) notFound();

  const p = await prisma.property.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  return (
    <PropertyForm
      mode="admin"
      doneHref="/admin/properties"
      propertyId={p.id}
      initial={{
        listingType: p.listingType,
        lodgeType: p.lodgeType ?? "",
        amenities: p.amenities,
        title: p.title,
        description: p.description,
        rent: String(p.rent),
        state: p.state,
        city: p.city,
        address: p.address ?? "",
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
        plusCode: p.plusCode ?? "",
        landmarkDirections: p.landmarkDirections ?? "",
        bedrooms: String(p.bedrooms),
        bathrooms: String(p.bathrooms),
        furnished: p.furnished,
        photos: p.photos,
        exteriorPhotos: p.exteriorPhotos,
        videos: p.videos,
        verifiedProperty: p.verifiedProperty,
      }}
    />
  );
}
