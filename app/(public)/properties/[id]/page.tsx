import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFullAccess } from "@/lib/access";
import { UNLOCK_COST, ESCORT_COST } from "@/lib/pricing";
import { formatPrice, directionsUrl, hasMapLocation } from "@/lib/format";
import { lodgeLabel, amenityLabel } from "@/lib/lodge";
import { signedVideoUrl } from "@/lib/cloudinary";
import ContactLandlordBox from "@/components/ContactLandlordBox";
import ReportButton from "@/components/ReportButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import UnlockBox from "@/components/UnlockBox";
import EscortBox from "@/components/EscortBox";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          role: true,
          agencyName: true,
          licenseNumber: true,
          verification: { select: { status: true } },
        },
      },
    },
  });

  const isOwner = !!session && property?.landlordId === session.user.id;
  // Pending, rejected or removed listings are only visible to their owner.
  if (!property || (property.status !== "APPROVED" && !isOwner)) notFound();

  const full = await hasFullAccess(session?.user.id, property);
  const lister = property.landlord;
  const listerVerified = lister.verification?.status === "APPROVED";
  const listerLabel = lister.role === "AGENT" ? "agent" : "landlord";
  const mapKnown = hasMapLocation(property);
  const directions = directionsUrl(property);
  const isSale = property.listingType === "SALE";
  const featured = !!property.featuredUntil && property.featuredUntil > new Date();

  // The free preview is ONE photo of the inside. The outside of the building, every other
  // photo and the lister's identity unlock after payment, so nobody can work out which house
  // it is from the pictures and then skip the platform.
  const interior = property.photos;
  const exterior = property.exteriorPhotos;
  const photos = full ? interior : interior.slice(0, 1);
  const outside = full ? exterior : [];
  const lockedPhotos = interior.length - photos.length + exterior.length - outside.length;

  // Video tours are part of the full view. Playable links exist only for people who unlocked.
  const videoCount = property.videos.length;
  const playable = full
    ? property.videos.map(signedVideoUrl).filter((u): u is string => !!u)
    : [];

  const escort =
    session && !isOwner
      ? await prisma.escortRequest.findFirst({
          where: { propertyId: property.id, seekerId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, preferredTime: true },
        })
      : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-2">
          {photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={property.title}
              className={`w-full rounded-lg object-cover ${i === 0 && !full ? "col-span-2 h-72" : "h-56"}`}
            />
          ))}
          {lockedPhotos > 0 && (
            <div className="col-span-2 flex h-24 items-center justify-center rounded-lg bg-neutral-100 px-4 text-center text-sm text-neutral-500">
              🔒 {lockedPhotos} more photo{lockedPhotos === 1 ? "" : "s"}
              {exterior.length > 0 ? ", including the outside of the building," : ""} unlock{lockedPhotos === 1 ? "s" : ""} with the full view
            </div>
          )}
        </div>

        {outside.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Outside the building</p>
            <div className="grid grid-cols-2 gap-2">
              {outside.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`${property.title}, outside`} className="h-56 w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        {playable.length > 0 && (
          <div className="mt-3 space-y-3">
            {playable.map((src) => (
              <video key={src} src={src} controls preload="metadata" playsInline className="w-full rounded-lg bg-black" />
            ))}
          </div>
        )}
        {!full && videoCount > 0 && (
          <div className="mt-3 flex h-20 items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-500">
            🎬 {videoCount} video tour{videoCount === 1 ? "" : "s"} unlock{videoCount === 1 ? "s" : ""} with the full view
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{property.title}</h1>
          {property.isOfficial && (
            <span className="rounded bg-brand-600 px-2 py-1 text-xs text-white">
              Official bedlisting
            </span>
          )}
          {featured && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">Featured</span>
          )}
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
            {isSale ? "For sale" : "For rent"}
          </span>
          {property.lodgeType && (
            <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
              {lodgeLabel(property.lodgeType)}
            </span>
          )}
          {property.verifiedProperty && (
            <span className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-700">
              Verified property
            </span>
          )}
        </div>
        <p className="text-neutral-500">
          {property.city}, {property.state}
        </p>
        <p className="mt-2 text-xl font-semibold">{formatPrice(property)}</p>
        <p className="mt-1 text-sm text-neutral-600">
          {property.bedrooms} bed · {property.bathrooms} bath ·{" "}
          {property.furnished ? "Furnished" : "Unfurnished"}
        </p>
        {property.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <span key={a} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                ✓ {amenityLabel(a)}
              </span>
            ))}
          </div>
        )}
        {property.amenities.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            Amenities are stated by the lister and are not checked by bedlisting. Confirm them when you
            visit. If something is wrong, use Report below.
          </p>
        )}

        <p className="mt-6 whitespace-pre-wrap text-neutral-700">{property.description}</p>

        {/* ---- Location ---- */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 font-medium">Location and directions</h2>

          {!mapKnown && (
            <p className="mb-2 inline-block rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-800">
              ⚠ No Google Maps location for this property
            </p>
          )}

          {full ? (
            <div className="space-y-2 text-sm text-neutral-700">
              {property.address && <p>{property.address}</p>}
              {property.plusCode && (
                <p>
                  Plus Code: <span className="font-mono">{property.plusCode}</span>
                </p>
              )}
              {property.landmarkDirections && (
                <p className="whitespace-pre-wrap">
                  <span className="font-medium">Directions: </span>
                  {property.landmarkDirections}
                </p>
              )}
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                >
                  Get directions in Google Maps
                </a>
              )}
              {!mapKnown && !property.landmarkDirections && (
                <p className="text-neutral-500">
                  No map pin or written directions were provided. Ask the {listerLabel}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              🔒 The exact address, map pin and directions unlock with the full view.
            </p>
          )}
        </div>

        {/* ---- Lister ---- */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          {property.isOfficial ? (
            <p className="text-sm">Listed by <span className="font-medium">bedlisting</span></p>
          ) : full ? (
            <>
              <p className="text-sm">
                Listed by <span className="font-medium">{lister.name}</span>
                {listerVerified && <VerifiedBadge label={`Verified ${listerLabel}`} />}
                <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">{listerLabel}</span>
                {!listerVerified && (
                  <span className="ml-2 rounded bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">Not verified</span>
                )}
              </p>
              {lister.agencyName && <p className="mt-1 text-sm text-neutral-500">{lister.agencyName}</p>}
              {lister.role === "AGENT" && lister.licenseNumber && (
                <p className="mt-1 text-xs text-neutral-500">
                  Licence number given: {lister.licenseNumber} (shown as provided by the agent)
                </p>
              )}
            </>
          ) : (
            <p className="text-sm">
              Listed by a{" "}
              {listerVerified ? (
                <VerifiedBadge label={`verified ${listerLabel}`} />
              ) : (
                <span className="capitalize">{listerLabel}</span>
              )}
              <span className="ml-2 text-xs text-neutral-500">Their name and details unlock with the full view.</span>
            </p>
          )}
          <div className="mt-2">
            <ReportButton propertyId={property.id} reportedUserId={full ? lister.id : undefined} />
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-1">
        {isOwner ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            This is your listing. Status: <span className="font-medium">{property.status}</span>
          </div>
        ) : full ? (
          <>
            <ContactLandlordBox propertyId={property.id} landlordId={lister.id} />
            {lister.role === "AGENT" && (
              <EscortBox propertyId={property.id} cost={ESCORT_COST} existing={escort} />
            )}
          </>
        ) : (
          <UnlockBox
            propertyId={property.id}
            cost={UNLOCK_COST[property.listingType]}
            signedIn={!!session}
            isSale={isSale}
            extraPhotos={lockedPhotos}
            videoCount={videoCount}
          />
        )}
      </div>
    </div>
  );
}
