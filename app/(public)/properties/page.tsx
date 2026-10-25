import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, hasMapLocation } from "@/lib/format";
import VerifiedBadge from "@/components/VerifiedBadge";
import { LODGE_TYPES, AMENITIES, isLodgeType, isAmenity, lodgeLabel, amenityLabel } from "@/lib/lodge";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { q, state, city, minPrice, maxPrice, bedrooms, furnished, listingType } = searchParams;

  // Ticked amenity boxes arrive as one value or a list. A listing must have ALL ticked ones.
  const rawAmenity = searchParams.amenity as unknown as string | string[] | undefined;
  const amenityFilter = (Array.isArray(rawAmenity) ? rawAmenity : rawAmenity ? [rawAmenity] : []).filter(isAmenity);
  const lodgeFilter = isLodgeType(searchParams.lodgeType) ? searchParams.lodgeType : undefined;

  const properties = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      state: state ? { contains: state, mode: "insensitive" } : undefined,
      city: city ? { contains: city, mode: "insensitive" } : undefined,
      // Free-text area search (the homepage box and area chips): "Hilltop", "Odim"...
      OR: q
        ? [
            { city: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      furnished: furnished ? furnished === "true" : undefined,
      lodgeType: lodgeFilter,
      amenities: amenityFilter.length ? { hasEvery: amenityFilter } : undefined,
      listingType: listingType === "RENT" || listingType === "SALE" ? listingType : undefined,
      rent: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, city: true, state: true, bedrooms: true, bathrooms: true,
      rent: true, listingType: true, verifiedProperty: true, isOfficial: true,
      featuredUntil: true, latitude: true, longitude: true, plusCode: true,
      photos: true, videos: true, lodgeType: true, amenities: true,
      landlord: { select: { role: true, verification: { select: { status: true } } } },
    },
  });

  // Paid boosts show first; everything else stays newest-first.
  const now = new Date();
  const isFeatured = (p: { featuredUntil: Date | null }) => !!p.featuredUntil && p.featuredUntil > now;
  properties.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <form className="space-y-4 lg:col-span-1">
        <h2 className="font-semibold">Filters</h2>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search area e.g. Hilltop, Odim"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          name="listingType"
          defaultValue={listingType || ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Rent or sale</option>
          <option value="RENT">For rent</option>
          <option value="SALE">For sale</option>
        </select>
        <select
          name="lodgeType"
          defaultValue={lodgeFilter || ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Any type of lodge</option>
          {LODGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <fieldset className="space-y-1 text-sm">
          <legend className="mb-1 font-medium">Amenities</legend>
          {AMENITIES.map((a) => (
            <label key={a.value} className="flex items-center gap-2">
              <input type="checkbox" name="amenity" value={a.value} defaultChecked={amenityFilter.includes(a.value)} />
              {a.label}
            </label>
          ))}
        </fieldset>
        <input
          name="state"
          defaultValue={state}
          placeholder="State"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="city"
          defaultValue={city}
          placeholder="City"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            name="minPrice"
            defaultValue={minPrice}
            placeholder="Min ₦"
            className="w-1/2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="maxPrice"
            defaultValue={maxPrice}
            placeholder="Max ₦"
            className="w-1/2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <input
          name="bedrooms"
          defaultValue={bedrooms}
          placeholder="Bedrooms"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          name="furnished"
          defaultValue={furnished || ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Furnished / Unfurnished</option>
          <option value="true">Furnished</option>
          <option value="false">Unfurnished</option>
        </select>
        <button className="w-full rounded-md bg-brand-600 py-2 text-sm text-white hover:bg-brand-700">
          Apply filters
        </button>
      </form>

      <div className="lg:col-span-3">
        <h1 className="mb-4 text-xl font-semibold">
          {properties.length} propert{properties.length === 1 ? "y" : "ies"} found
        </h1>

        {properties.length === 0 ? (
          <p className="text-neutral-500">
            No listings match those filters yet. Try widening your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="block rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
              >
                {p.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photos[0]}
                    alt={p.title}
                    className="mb-3 h-40 w-full rounded-md object-cover"
                  />
                )}
                <div className="mb-1 flex flex-wrap gap-1">
                  {isFeatured(p) && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Featured</span>
                  )}
                  {p.isOfficial && (
                    <span className="rounded bg-brand-600 px-2 py-0.5 text-xs text-white">Official</span>
                  )}
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                    {p.listingType === "SALE" ? "For sale" : "For rent"}
                  </span>
                  {p.videos.length > 0 && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">🎬 Video</span>
                  )}
                  {p.lodgeType && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                      {lodgeLabel(p.lodgeType)}
                    </span>
                  )}
                  {p.verifiedProperty && (
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Verified property</span>
                  )}
                  {!hasMapLocation(p) && (
                    <span className="rounded bg-yellow-50 px-2 py-0.5 text-xs text-yellow-800">No map pin</span>
                  )}
                </div>
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-sm text-neutral-500">
                  {p.city}, {p.state} · {p.bedrooms} bed · {p.bathrooms} bath
                </p>
                <p className="mt-1 font-semibold">{formatPrice(p)}</p>
                {p.amenities.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">{p.amenities.map(amenityLabel).join(" · ")}</p>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  {p.isOfficial ? (
                    "bedlisting"
                  ) : p.landlord.verification?.status === "APPROVED" ? (
                    <VerifiedBadge label={`Verified ${p.landlord.role.toLowerCase()}`} />
                  ) : (
                    <span className="capitalize">{p.landlord.role.toLowerCase()}</span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
