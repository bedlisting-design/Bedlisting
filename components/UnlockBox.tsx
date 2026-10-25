"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UnlockBox({
  propertyId,
  cost,
  signedIn,
  isSale,
  extraPhotos,
  videoCount = 0,
}: {
  propertyId: string;
  cost: number;
  signedIn: boolean;
  isSale: boolean;
  extraPhotos: number;
  videoCount?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needCoins, setNeedCoins] = useState(false);

  async function unlock() {
    if (!signedIn) {
      router.push(`/login?callbackUrl=/properties/${propertyId}`);
      return;
    }
    setLoading(true);
    setError("");
    setNeedCoins(false);

    const res = await fetch(`/api/properties/${propertyId}/unlock`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.status === 402) {
      setNeedCoins(true);
      setError(data.error || "Not enough bedcoins.");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    window.dispatchEvent(new Event("bedcoins:changed"));
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-medium">
        {isSale ? "Connect with the seller" : "See the full property"}
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-neutral-600">
        {extraPhotos > 0 && <li>• {extraPhotos} more photo{extraPhotos === 1 ? "" : "s"}, inside and outside</li>}
        <li>• The lister’s name and details</li>
        {videoCount > 0 && <li>• {videoCount} video tour{videoCount === 1 ? "" : "s"}</li>}
        <li>• Exact address, map pin and directions</li>
        <li>• Message the {isSale ? "seller" : "owner"} directly</li>
      </ul>

      <button
        onClick={unlock}
        disabled={loading}
        className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Unlocking..." : `Unlock for ${cost} bedcoins`}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {needCoins && (
        <Link href="/credits" className="mt-1 block text-sm text-brand-700 underline">
          Buy bedcoins
        </Link>
      )}
      <p className="mt-3 text-xs text-neutral-500">
        You pay once per property. If bedlisting removes a listing as fake, your
        bedcoins are returned.
      </p>
    </div>
  );
}
