export function formatPrice(p: { rent: number; listingType: "RENT" | "SALE" | string }) {
  const amount = `₦${p.rent.toLocaleString()}`;
  return p.listingType === "SALE" ? amount : `${amount}/yr`;
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function isListerRole(role?: string | null) {
  return role === "LANDLORD" || role === "AGENT";
}

/** Free Google Maps directions link (no API key, no billing). */
export function directionsUrl(p: {
  latitude: number | null;
  longitude: number | null;
  plusCode: string | null;
}) {
  const destination =
    p.latitude != null && p.longitude != null
      ? `${p.latitude},${p.longitude}`
      : p.plusCode || null;
  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function hasMapLocation(p: {
  latitude: number | null;
  longitude: number | null;
  plusCode: string | null;
}) {
  return (p.latitude != null && p.longitude != null) || !!p.plusCode;
}

/** "Chika Okafor" -> "Chika O." (the privacy rule for people in conversations). */
export function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

/** Admins always appear as the bedlisting team, never by their personal name. */
export function displayUserName(u: { name: string; role: string }) {
  return u.role === "ADMIN" ? "bedlisting team" : maskName(u.name);
}
