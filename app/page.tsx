import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UNLOCK_COST, SIGNUP_BONUS_CREDITS } from "@/lib/pricing";
import { LODGE_TYPES, lodgeLabel, amenityLabel } from "@/lib/lodge";
import { formatPrice } from "@/lib/format";

// Shows live listings, so it is built per request (never at deploy time).
export const dynamic = "force-dynamic";

const AREAS = [
  { name: "Hilltop", note: "Lively · Close to campus" },
  { name: "Odenigwe", note: "Quieter · Good for reading" },
  { name: "Odim", note: "Budget-friendly · Safe" },
  { name: "Behind Flat", note: "Near stadium" },
  { name: "Green House", note: "Affordable options" },
  { name: "VET Area", note: "Science students" },
];

type Teaser = {
  id: string;
  title: string;
  area: string;
  price: string;
  type: string | null;
  verified: boolean;
  featured: boolean;
  amenities: string[];
  photo: string | null; // only filled for signed-in visitors
};

/**
 * A few fresh listings for the home page. Visitors who are not signed in get
 * words and numbers only: no photo link is ever sent to their browser.
 */
async function getTeasers(signedIn: boolean): Promise<Teaser[]> {
  try {
    const rows = await prisma.property.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, title: true, city: true, state: true, rent: true, listingType: true,
        lodgeType: true, amenities: true, verifiedProperty: true, isOfficial: true, featuredUntil: true,
        photos: true,
        landlord: { select: { verification: { select: { status: true } } } },
      },
    });
    const now = new Date();
    const isFeatured = (r: { featuredUntil: Date | null }) => !!r.featuredUntil && r.featuredUntil > now;
    rows.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)));
    return rows.slice(0, 3).map((r) => ({
      id: r.id,
      title: r.title,
      area: [r.city, r.state].filter(Boolean).join(", "),
      price: formatPrice(r),
      type: lodgeLabel(r.lodgeType),
      verified: r.verifiedProperty || r.isOfficial || r.landlord.verification?.status === "APPROVED",
      featured: isFeatured(r),
      amenities: r.amenities.slice(0, 3).map(amenityLabel),
      // Only signed-in visitors get a photo link; for everyone else it stays on the server.
      photo: signedIn ? r.photos[0] ?? null : null,
    }));
  } catch (err) {
    console.error("Home page listings failed:", err);
    return [];
  }
}

const gate = (path: string) => `/register?callbackUrl=${encodeURIComponent(path)}`;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session;
  const isLister = session?.user.role === "LANDLORD" || session?.user.role === "AGENT";
  const teasers = await getTeasers(signedIn);

  const browseHref = signedIn ? "/properties" : gate("/properties");
  const listHref = isLister ? "/landlord/properties/new" : "/register";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1220] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-12 text-center md:px-8 md:pb-20 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            🛡️ Direct landlord listings
          </span>
          <h1 className="mt-6 text-[2rem] font-bold leading-[1.15] tracking-tight sm:text-5xl">
            Find Your Ideal Lodge or Flat in <span className="text-emerald-400">Nsukka</span>{" "}
            <span className="block sm:inline">Without Fake Listings</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Built for UNN students and Nsukka residents. Search ID-checked lodges in Hilltop, Odenigwe, Odim and more,
            then unlock the full details when you are ready.
          </p>

          {/* Search card */}
          <form
            action="/properties"
            method="get"
            className="mx-auto mt-9 max-w-2xl rounded-3xl bg-white p-3 text-left shadow-2xl md:p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">📍</span>
                <select
                  name="q"
                  aria-label="Nsukka zone"
                  defaultValue=""
                  className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-4 text-sm text-neutral-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
                >
                  <option value="">Select Nsukka zone</option>
                  {AREAS.map((a) => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </label>
              <label className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">🏢</span>
                <select
                  name="lodgeType"
                  aria-label="Room type"
                  defaultValue=""
                  className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-11 pr-4 text-sm text-neutral-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
                >
                  <option value="">All room types</option>
                  {LODGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="mt-3 w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
              🔍 Find lodges
            </button>
          </form>

          {!signedIn && (
            <p className="mt-4 text-sm text-white/70">
              Free account needed to browse.{" "}
              <Link href="/register" className="font-semibold text-emerald-300 underline-offset-4 hover:underline">
                Sign up in a minute
              </Link>{" "}
              and get {SIGNUP_BONUS_CREDITS} free bedcoins.
            </p>
          )}

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-y-8 border-t border-white/10 pt-10 md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-emerald-400">ID-checked</p>
              <p className="mt-1 text-xs text-white/60">Every landlord verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{SIGNUP_BONUS_CREDITS}</p>
              <p className="mt-1 text-xs text-white/60">Free bedcoins for new seekers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">Refunded</p>
              <p className="mt-1 text-xs text-white/60">If a listing is removed as fake</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{AREAS.length}</p>
              <p className="mt-1 text-xs text-white/60">Student areas covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Built specifically for Nsukka realities</h2>
          <p className="mt-2 text-neutral-600">No more wasting money on places that turn out to be fake.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl">🛡️</div>
            <h3 className="mt-4 text-lg font-semibold">Verified landlords</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Every landlord submits a government ID that our team reviews before they can post. Each listing is approved by an admin before it goes live.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">💬</div>
            <h3 className="mt-4 text-lg font-semibold">Private messaging</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Chat with the lister inside the app. Your full name stays hidden until you choose to share it. Zero pressure.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl">🔒</div>
            <h3 className="mt-4 text-lg font-semibold">Unlock only when ready</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Spend {UNLOCK_COST.RENT} bedcoins, once per property, to see everything and message the lister. Not interested? You spend nothing.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl">📍</div>
            <h3 className="mt-4 text-lg font-semibold">Photos, video tours and exact location</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Unlocked listings show every photo, video tours where the lister added one, a map pin and written directions.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">🚨</div>
            <h3 className="mt-4 text-lg font-semibold">Refund protection</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Report anything suspicious in one tap. If we remove a listing as fraudulent, everyone who unlocked it gets their bedcoins back.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">🤝</div>
            <h3 className="mt-4 text-lg font-semibold">Find a roommate</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Create a profile, see compatible people and send a request. Your bedcoins come back if they decline or do not reply.</p>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {teasers.length > 0 && (
        <section className="border-y border-neutral-200/80 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Featured Nsukka lodges</h2>
                <p className="mt-1 text-neutral-600">Fresh listings from ID-checked landlords.</p>
              </div>
              <Link href={browseHref} className="text-sm font-semibold text-brand-700 hover:underline">
                {signedIn ? "View all listings →" : "Sign up to view all listings →"}
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teasers.map((t) => (
                <article key={t.id} className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
                  <div className="relative h-48 bg-gradient-to-br from-brand-700 to-[#0b1220]">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt={t.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-white/90">
                        <span className="text-3xl">🔒</span>
                        <span className="text-sm font-medium">Sign up free to see photos</span>
                      </div>
                    )}
                    {t.type && (
                      <span className="absolute left-3 top-3 rounded-lg bg-neutral-900/80 px-3 py-1 text-xs font-semibold text-white">{t.type}</span>
                    )}
                    {t.verified && (
                      <span className="absolute right-3 top-3 rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white">✓ Verified</span>
                    )}
                    {t.featured && (
                      <span className="absolute bottom-3 left-3 rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-900">Featured</span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-brand-700">📍 {t.area}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug">{t.title}</h3>
                    {t.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {t.amenities.map((a) => (
                          <span key={a} className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">{a}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                      <div>
                        <p className="text-xs text-neutral-500">Rent</p>
                        <p className="text-lg font-bold">{t.price}</p>
                      </div>
                      <Link
                        href={signedIn ? `/properties/${t.id}` : gate(`/properties/${t.id}`)}
                        className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                      >
                        {signedIn ? "Inspect →" : "Sign up to inspect →"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POPULAR AREAS */}
      <section id="areas" className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Explore by area</p>
          <h2 className="mt-1 text-2xl font-bold text-neutral-900">Popular student areas in Nsukka</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {AREAS.map((a) => (
            <Link
              key={a.name}
              href={signedIn ? `/properties?q=${encodeURIComponent(a.name)}` : gate(`/properties?q=${encodeURIComponent(a.name)}`)}
              className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold group-hover:text-brand-700">{a.name}</p>
              <p className="mt-1 text-[11px] text-neutral-500">{a.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-neutral-200/80 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Simple process</p>
            <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">How bedlisting works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <span className="text-5xl font-bold text-brand-100">01</span>
              <h3 className="mt-2 text-lg font-semibold">Create your free account</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Sign up in a minute. New seekers get {SIGNUP_BONUS_CREDITS} free bedcoins, enough to unlock one property.</p>
            </div>
            <div>
              <span className="text-5xl font-bold text-brand-100">02</span>
              <h3 className="mt-2 text-lg font-semibold">Search and unlock</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Filter by area, lodge type and amenities. Found something good? Spend {UNLOCK_COST.RENT} bedcoins to see all photos, the exact location and message the lister.</p>
            </div>
            <div>
              <span className="text-5xl font-bold text-brand-100">03</span>
              <h3 className="mt-2 text-lg font-semibold">Talk and move in</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Message the lister directly inside the app. Share your contact only when you are ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LANDLORD CTA */}
      <section id="landlord" className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] to-[#0b1220] px-6 py-10 text-white md:px-14 md:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              👥 For Nsukka landlords
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">Have a lodge or apartment in Hilltop, Odenigwe or Town?</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
              Fill your vacant rooms faster with verified UNN students and working professionals. Listing is free, and
              you earn when people unlock your property.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={listHref} className="rounded-2xl bg-emerald-500 px-7 py-3.5 text-center text-sm font-semibold text-neutral-900 hover:bg-emerald-400">
                List your property
              </Link>
              <Link href="/faq" className="rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-center text-sm font-semibold text-white hover:bg-white/10">
                Learn how bedcoins work
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
              <span>✓ Free to list</span>
              <span>✓ ID verification required</span>
              <span>✓ Direct student enquiries</span>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA (visitors only) */}
      {!signedIn && (
        <section className="mx-auto max-w-3xl px-4 pb-20 text-center md:px-8">
          <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">Ready to find your lodge?</h2>
          <p className="mt-2 text-neutral-600">Create a free account and start searching today.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="rounded-2xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
              Sign up free
            </Link>
            <Link href="/login" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
