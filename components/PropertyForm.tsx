"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUploadInput from "@/components/FileUploadInput";
import VideoUploadInput from "@/components/VideoUploadInput";
import { LODGE_TYPES, AMENITIES } from "@/lib/lodge";

const input = "w-full rounded-md border border-neutral-300 px-3 py-2";
const half = "w-1/2 rounded-md border border-neutral-300 px-3 py-2";

export type PropertyFormInitial = {
  listingType: "RENT" | "SALE";
  lodgeType: string;
  amenities: string[];
  title: string;
  description: string;
  rent: string;
  state: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  plusCode: string;
  landmarkDirections: string;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  photos: string[];
  exteriorPhotos: string[];
  videos: string[];
  verifiedProperty: boolean;
};

const blank: PropertyFormInitial = {
  listingType: "RENT", lodgeType: "", amenities: [], title: "", description: "", rent: "",
  state: "", city: "", address: "", latitude: "", longitude: "", plusCode: "",
  landmarkDirections: "", bedrooms: "", bathrooms: "", furnished: false, photos: [], exteriorPhotos: [], videos: [], verifiedProperty: false,
};

function PhotoGroup({
  title, help, urls, setUrls, label,
}: {
  title: string; help: string; urls: string[]; setUrls: (u: string[]) => void; label: string;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title}</p>
      <p className="mb-2 text-xs text-neutral-500">{help}</p>
      {urls.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-full rounded object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 text-[10px] text-white">First</span>}
              <button type="button" aria-label="Remove photo" onClick={() => setUrls(urls.filter((u) => u !== url))}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">✕</button>
            </div>
          ))}
        </div>
      )}
      <FileUploadInput label={label} kind="photo" multiple onUploaded={(added) => setUrls([...urls, ...added])} />
    </div>
  );
}

export default function PropertyForm({
  propertyId,
  initial,
  mode = "lister",
  doneHref = "/landlord/dashboard",
}: {
  propertyId?: string; // present = editing
  initial?: PropertyFormInitial;
  mode?: "lister" | "admin"; // admins post official listings that go live at once
  doneHref?: string;
}) {
  const editing = !!propertyId;
  const router = useRouter();
  const start = initial ?? blank;
  const [form, setForm] = useState(start);
  const [photos, setPhotos] = useState<string[]>(start.photos);
  const [exteriorPhotos, setExteriorPhotos] = useState<string[]>(start.exteriorPhotos);
  const [videos, setVideos] = useState<string[]>(start.videos);
  const [ownershipDocUrl, setOwnershipDocUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (k: keyof PropertyFormInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function fillMyLocation() {
    if (!navigator.geolocation) return setError("Your browser can't share its location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Enter it by hand or use a Plus Code.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (photos.length === 0) return setError("Add at least one photo of the inside.");
    const hasLat = form.latitude.trim() !== "";
    const hasLng = form.longitude.trim() !== "";
    if (hasLat !== hasLng) return setError("Enter both latitude and longitude, or leave both empty.");

    const rent = form.listingType === "RENT";
    // When editing, an empty optional field is sent as null so it is really cleared.
    const empty = editing ? null : undefined;

    setLoading(true);
    const res = await fetch(editing ? `/api/properties/${propertyId}` : "/api/properties", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingType: form.listingType,
        lodgeType: rent && form.lodgeType ? form.lodgeType : empty,
        amenities: rent ? form.amenities : [],
        title: form.title,
        description: form.description,
        rent: Number(form.rent),
        state: form.state,
        city: form.city,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnished: form.furnished,
        photos,
        exteriorPhotos,
        videos,
        verifiedProperty: mode === "admin" ? form.verifiedProperty : undefined,
        ownershipDocUrl: ownershipDocUrl || undefined,
        address: form.address || empty,
        latitude: hasLat ? Number(form.latitude) : empty,
        longitude: hasLng ? Number(form.longitude) : empty,
        plusCode: form.plusCode || empty,
        landmarkDirections: form.landmarkDirections || empty,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error || "Something went wrong.");
    }
    router.push(doneHref);
    router.refresh();
  }

  const noPin = !form.latitude && !form.longitude && !form.plusCode;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold">
        {editing ? "Edit listing" : mode === "admin" ? "Post an official listing" : "List a property"}
      </h1>
      {mode === "admin" && (
        <p className="mb-6 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
          You are posting as bedlisting. The listing goes live straight away and is tagged
          &quot;Official bedlisting&quot;. People who unlock it pay bedlisting; there is no lister share.
        </p>
      )}
      {editing && mode !== "admin" && (
        <p className="mb-6 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
          Changing the title, photos, videos, price, place or ownership document sends the listing back for
          review, and it is hidden until approved. Other changes, such as amenities, go live straight away.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-md border border-neutral-300 p-1">
          {(["RENT", "SALE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, listingType: t })}
              className={`flex-1 rounded py-2 text-sm ${form.listingType === t ? "bg-brand-600 text-white" : "text-neutral-600"}`}
            >
              {t === "RENT" ? "For rent" : "For sale"}
            </button>
          ))}
        </div>

        {form.listingType === "RENT" && (
          <>
            <select required value={form.lodgeType} onChange={(e) => setForm({ ...form, lodgeType: e.target.value })} className={input}>
              <option value="">Type of lodge</option>
              {LODGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <fieldset className="rounded-lg border border-neutral-200 p-4">
              <legend className="px-1 text-sm font-medium">Amenities (tick only what is true today)</legend>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {AMENITIES.map((a) => (
                  <label key={a.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(a.value)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          amenities: e.target.checked
                            ? [...form.amenities, a.value]
                            : form.amenities.filter((x) => x !== a.value),
                        })
                      }
                    />
                    {a.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Seekers will see these as your own statements. Wrong amenities can get your listing
                reported and removed.
              </p>
            </fieldset>
          </>
        )}

        <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
          People see the title and description before they pay. Do not put the street, estate name
          or landmarks in them. Put those in Location below, which unlocks after payment.
        </p>
        <input required placeholder="Title" value={form.title} onChange={set("title")} className={input} />
        <textarea required placeholder="Description" rows={4} value={form.description} onChange={set("description")} className={input} />
        <input required type="number" value={form.rent} onChange={set("rent")} className={input}
          placeholder={form.listingType === "RENT" ? "Annual rent (₦)" : "Asking price (₦)"} />

        <div className="flex gap-2">
          <input required placeholder="State" value={form.state} onChange={set("state")} className={half} />
          <input required placeholder="City or area" value={form.city} onChange={set("city")} className={half} />
        </div>
        <div className="flex gap-2">
          <input required type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={set("bedrooms")} className={half} />
          <input required type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={set("bathrooms")} className={half} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} />
          Furnished
        </label>

        <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <legend className="px-1 text-sm font-medium">Location (shown only after a user unlocks)</legend>
          <input placeholder="Street address (optional)" value={form.address} onChange={set("address")} className={input} />
          <button type="button" onClick={fillMyLocation} disabled={locating}
            className="w-full rounded-md border border-brand-600 py-2 text-sm text-brand-700 disabled:opacity-50">
            {locating ? "Getting location..." : "📍 Use my current location (stand at the property)"}
          </button>
          <div className="flex gap-2">
            <input placeholder="Latitude" value={form.latitude} onChange={set("latitude")} className={half} />
            <input placeholder="Longitude" value={form.longitude} onChange={set("longitude")} className={half} />
          </div>
          <input placeholder="Google Plus Code (e.g. 6FR9+XJ Enugu), for places with no address" value={form.plusCode} onChange={set("plusCode")} className={input} />
          <textarea rows={3} placeholder="Written directions and landmarks (for example: after the big mango tree, turn left at the church)"
            value={form.landmarkDirections} onChange={set("landmarkDirections")} className={input} />
          {noPin && (
            <p className="rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
              With no pin or Plus Code, your listing will show a &quot;No Google Maps location&quot; tag.
              Written directions help people find you.
            </p>
          )}
        </fieldset>

        <PhotoGroup
          title="Photos of the INSIDE (the first one is shown free to everyone)"
          help="Show the inside of the home only: no windows that show the street, no gate, signs, compound or neighbours. The first inside photo is the only picture people see before they pay, so make sure nobody could recognise the building from it."
          urls={photos}
          setUrls={setPhotos}
          label={editing ? "Add more inside photos" : "Upload inside photos"}
        />

        <PhotoGroup
          title="Photos of the OUTSIDE (optional, shown only after payment)"
          help="The front of the building, the gate or compound. Nobody sees these until they unlock the listing."
          urls={exteriorPhotos}
          setUrls={setExteriorPhotos}
          label="Upload outside photos"
        />

        <div>
          <p className="mb-1 text-sm font-medium">Video tour (optional, up to 2)</p>
          <p className="mb-2 text-xs text-neutral-500">
            MP4, MOV or WebM, up to 80 MB each. A short walk-through (under a minute) works best. Only
            people who unlock your listing can watch it.
          </p>
          {videos.length > 0 && (
            <ul className="mb-2 space-y-1">
              {videos.map((url, i) => (
                <li key={url} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm">
                  <span>🎬 Video {i + 1}</span>
                  <button type="button" onClick={() => setVideos(videos.filter((v) => v !== url))} className="text-red-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {videos.length < 2 && (
            <VideoUploadInput label="Add a video" onUploaded={(url) => setVideos((v) => [...v, url])} />
          )}
        </div>

        <FileUploadInput
          label={
            editing
              ? "Replace proof of ownership (optional). Stored privately; only bedlisting staff can see it"
              : "Proof of ownership (title deed, lease, or utility bill matching the address). Stored privately; only bedlisting staff can see it. Optional but needed for the Verified property badge"
          }
          kind="id_document"
          onUploaded={(urls) => setOwnershipDocUrl(urls[0])}
        />

        {mode === "admin" && (
          <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
            <input type="checkbox" className="mt-1" checked={form.verifiedProperty}
              onChange={(e) => setForm({ ...form, verifiedProperty: e.target.checked })} />
            <span>Mark as &quot;Verified property&quot;. Tick only if you have checked proof of ownership.</span>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Saving..." : editing ? "Save changes" : "Submit for review"}
        </button>
        {!editing && mode !== "admin" && (
          <p className="text-xs text-neutral-500">Listings are reviewed by an admin before going live, usually within 24 hours.</p>
        )}
      </form>
    </div>
  );
}
