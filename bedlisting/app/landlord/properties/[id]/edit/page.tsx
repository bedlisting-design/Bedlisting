import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PropertyForm from "@/components/PropertyForm";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const p = session
    ? await prisma.property.findUnique({ where: { id: params.id } })
    : null;

  // Only the owner can open this page.
  if (!session || !p || p.landlordId !== session.user.id) notFound();

  if (p.status === "REMOVED") {
    return (
      <div className="mx-auto max-w-lg">
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-600">
          This listing was removed and cannot be edited.{" "}
          <Link href="/landlord/dashboard" className="text-brand-700 underline">Back to dashboard</Link>
        </p>
      </div>
    );
  }

  return (
    <PropertyForm
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
