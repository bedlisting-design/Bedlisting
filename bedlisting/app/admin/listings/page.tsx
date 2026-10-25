"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { lodgeLabel, amenityLabel } from "@/lib/lodge";

type AdminProperty = {
  id: string;
  title: string;
  rent: number;
  listingType: string;
  city: string;
  state: string;
  photos: string[];
  exteriorPhotos: string[];
  videos: string[];
  ownershipDocUrl: string | null;
  lodgeType: string | null;
  amenities: string[];
  verifiedProperty: boolean;
  landlord: { name: string; email: string; verification: { status: string } | null };
};

export default function AdminListingsPage() {
  const [tab, setTab] = useState<"PENDING" | "APPROVED">("PENDING");
  const [listings, setListings] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyDoc, setVerifyDoc] = useState<Record<string, boolean>>({});

  async function load(status = tab) {
    setLoading(true);
    const res = await fetch(`/api/admin/listings?status=${status}`);
    if (res.ok) setListings(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function approve(id: string) {
    await fetch(`/api/admin/listings/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verifyProperty: !!verifyDoc[id] }),
    });
    load();
  }

  async function reject(id: string) {
    await fetch(`/api/admin/listings/${id}/reject`, { method: "PATCH" });
    load();
  }

  async function removeScam(id: string) {
    if (
      !confirm(
        "Remove this listing as a scam? Everyone who paid to unlock it is refunded and the lister's un-withdrawn earnings from it are cancelled."
      )
    )
      return;
    const res = await fetch(`/api/admin/listings/${id}/remove`, { method: "PATCH" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) alert(`Removed. ${data.refundedUsers} user(s) refunded.`);
    load();
  }

  async function viewDoc(id: string) {
    const res = await fetch(`/api/admin/listings/${id}/ownership-doc`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.open(data.url, "_blank", "noopener");
    else alert(data.error || "Could not open the document.");
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["PENDING", "APPROVED"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t ? "bg-neutral-900 text-white" : "border border-neutral-300"
            }`}
          >
            {t === "PENDING" ? "Awaiting review" : "Live listings"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-neutral-500">Nothing here.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((p) => (
            <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {p.title}{" "}
                    <span className="text-xs text-neutral-400">
                      {p.listingType === "SALE" ? "sale" : "rent"}
                    </span>
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {p.city}, {p.state} · {formatPrice(p)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {lodgeLabel(p.lodgeType) ?? "No lodge type"} · Amenities claimed by lister (not checked):{" "}
                    {p.amenities.length ? p.amenities.map(amenityLabel).join(", ") : "none"}
                  </p>
                  <p className="mt-1 text-sm">
                    Lister: {p.landlord.name} ({p.landlord.email}),{" "}
                    <span
                      className={
                        p.landlord.verification?.status === "APPROVED"
                          ? "text-brand-700"
                          : "text-yellow-700"
                      }
                    >
                      {p.landlord.verification?.status || "not verified"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">
                    Ownership doc:{" "}
                    {p.ownershipDocUrl ? (
                      <button onClick={() => viewDoc(p.id)} className="text-brand-700 underline">
                        View (opens a 10-minute link)
                      </button>
                    ) : (
                      <span className="text-neutral-400">not provided</span>
                    )}
                    {p.verifiedProperty && (
                      <span className="ml-2 rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                        Verified property
                      </span>
                    )}
                  </p>
                  <Link href={`/admin/properties/${p.id}/edit`} className="mt-1 inline-block text-sm text-brand-700 underline">
                    Edit this listing
                  </Link>
                </div>

                {tab === "PENDING" ? (
                  <div className="flex flex-col items-end gap-2">
                    {p.ownershipDocUrl && (
                      <label className="flex items-center gap-2 text-xs text-neutral-600">
                        <input
                          type="checkbox"
                          checked={!!verifyDoc[p.id]}
                          onChange={(e) => setVerifyDoc({ ...verifyDoc, [p.id]: e.target.checked })}
                        />
                        I checked the document: mark Verified property
                      </label>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => approve(p.id)} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                        Approve
                      </button>
                      <button onClick={() => reject(p.id)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => removeScam(p.id)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                    Remove and refund
                  </button>
                )}
              </div>

              {p.exteriorPhotos.length > 0 && (
                <>
                  <p className="mt-3 text-xs font-medium text-neutral-500">Outside photos (hidden until someone pays)</p>
                  <div className="mt-1 flex gap-2 overflow-x-auto">
                    {p.exteriorPhotos.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt={p.title} className="h-24 w-32 flex-shrink-0 rounded object-cover" />
                    ))}
                  </div>
                </>
              )}

              <p className="mt-3 text-xs font-medium text-amber-700">
                Inside photos. The FIRST one is shown free to everyone: reject the listing if it shows the
                outside, the street, a gate or anything that identifies the building. Also check the title and
                description for street or estate names.
              </p>
              {p.videos.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.videos.map((src) => (
                    <video key={src} src={src} controls preload="metadata" playsInline className="w-full rounded bg-black" />
                  ))}
                </div>
              )}

              {p.photos.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {p.photos.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt={p.title} className="h-24 w-32 flex-shrink-0 rounded object-cover" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
