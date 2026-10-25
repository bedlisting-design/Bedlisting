import Link from "next/link";
import { UNLOCK_COST } from "@/lib/pricing";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(\'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1800&q=80\')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-[#0a3d2e]"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/80 md:justify-start md:text-sm">
              <span className="flex items-center gap-1.5">✓ ID-verified listers only</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block"></span>
              <span className="flex items-center gap-1.5">✓ Pay only to unlock</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block"></span>
              <span className="flex items-center gap-1.5">✓ Built for Nsukka & UNN</span>
            </div>

            <div className="max-w-3xl text-center md:text-left">
              <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
                Find real bedspaces & self-cons
                <span className="block text-emerald-300">near UNN Nsukka</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:mt-5 md:text-lg">
                Direct from ID-checked landlords. Fake listings get removed and refunded, so no last-minute wahala. Hilltop, Odenigwe, Odim and more.
              </p>

              <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch" action="/properties" method="get">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
                  <input type="text" name="q" aria-label="Search by area" placeholder="Search area e.g. Hilltop, Odenigwe, Odim..."
                    className="w-full rounded-2xl border-0 bg-white py-4 pl-11 pr-4 text-sm text-neutral-900 shadow-lg outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <button className="rounded-2xl bg-brand-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
                  Search lodges
                </button>
              </form>

              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                <Link href="/properties?q=Hilltop" className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20">Hilltop</Link>
                <Link href="/properties?q=Odenigwe" className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20">Odenigwe</Link>
                <Link href="/properties?q=Odim" className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20">Odim</Link>
                <Link href="/properties?q=Behind%20Flat" className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20">Behind Flat</Link>
                <Link href="/properties?q=Green%20House" className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20">Green House</Link>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:mt-16 md:max-w-lg md:gap-6 md:p-5">
              <div className="text-center">
                <p className="text-xl font-bold text-white md:text-2xl">Free</p>
                <p className="mt-0.5 text-[11px] text-white/70 md:text-xs">To browse</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white md:text-2xl">{UNLOCK_COST.RENT}</p>
                <p className="mt-0.5 text-[11px] text-white/70 md:text-xs">Bedcoins to unlock</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white md:text-2xl">Nsukka</p>
                <p className="mt-0.5 text-[11px] text-white/70 md:text-xs">Built for UNN</p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Why students choose us</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Built for the real Nsukka struggle</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">🛡️</div>
              <h3 className="mt-4 text-base font-semibold">Only ID-checked listers</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Every landlord submits government ID. Our team reviews it before they can post a single lodge. No more fake listings.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">💬</div>
              <h3 className="mt-4 text-base font-semibold">Message directly & privately</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Chat with the lister inside the app. Your full name stays hidden until you choose to share it. Zero pressure.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">🪙</div>
              <h3 className="mt-4 text-base font-semibold">Pay only when you’re serious</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Browse free. Unlock all photos, the exact location and direct messaging with {UNLOCK_COST.RENT} bedcoins, once per property.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">📍</div>
              <h3 className="mt-4 text-base font-semibold">Nsukka areas only</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Hilltop, Odenigwe, Odim, Behind Flat, Green House, VET… we focus on the places UNN students actually live.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">🏠</div>
              <h3 className="mt-4 text-base font-semibold">Self-cons, bedspaces & rooms</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Filter by lodge type (one room, self-con, boys’ quarters, hostel, 2 to 4 bedroom flats) and amenities like running water and constant light.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-xl">🚨</div>
              <h3 className="mt-4 text-base font-semibold">Report & stay safe</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">See something fishy? Report in one tap. We take safety seriously — this is your community platform.</p>
            </div>
          </div>
        </section>

        {/* POPULAR AREAS */}
        <section id="areas" className="border-y border-neutral-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-16">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Explore by area</p>
              <h2 className="mt-1 text-2xl font-bold text-neutral-900">Popular student areas in Nsukka</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Link href="/properties?q=Hilltop" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">Hilltop</p>
                <p className="mt-1 text-[11px] text-neutral-500">Lively · Close to campus</p>
              </Link>
              <Link href="/properties?q=Odenigwe" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">Odenigwe</p>
                <p className="mt-1 text-[11px] text-neutral-500">Quieter · Good for reading</p>
              </Link>
              <Link href="/properties?q=Odim" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">Odim</p>
                <p className="mt-1 text-[11px] text-neutral-500">Budget-friendly · Safe</p>
              </Link>
              <Link href="/properties?q=Behind%20Flat" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">Behind Flat</p>
                <p className="mt-1 text-[11px] text-neutral-500">Near stadium</p>
              </Link>
              <Link href="/properties?q=Green%20House" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">Green House</p>
                <p className="mt-1 text-[11px] text-neutral-500">Affordable options</p>
              </Link>
              <Link href="/properties?q=VET%20Area" className="group rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4 text-center transition hover:border-brand-300 hover:bg-brand-50">
                <p className="font-semibold group-hover:text-brand-700">VET Area</p>
                <p className="mt-1 text-[11px] text-neutral-500">Science students</p>
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Simple process</p>
            <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">How bedlisting works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <span className="text-5xl font-bold text-brand-100">01</span>
              <h3 className="mt-2 text-lg font-semibold">Browse free</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Search Hilltop, Odenigwe or any area. See one photo of the inside, the rent and basic details without creating an account.</p>
            </div>
            <div>
              <span className="text-5xl font-bold text-brand-100">02</span>
              <h3 className="mt-2 text-lg font-semibold">Unlock when ready</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Found something good? Spend {UNLOCK_COST.RENT} bedcoins to unlock all photos, the exact map location and direct messaging. You pay once per property.</p>
            </div>
            <div>
              <span className="text-5xl font-bold text-brand-100">03</span>
              <h3 className="mt-2 text-lg font-semibold">Talk & move in</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Message the lister directly inside the app. Share your contact only when you’re ready.</p>
            </div>
          </div>
        </section>

        {/* LANDLORD CTA */}
        <section id="landlord" className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-[#064e3b] px-6 py-12 text-center text-white md:px-16 md:py-16">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Own a lodge in Nsukka?</h2>
              <p className="mt-3 text-base text-white/85 md:text-lg">
                List your self-con, bedspace or rooms free. Reach students looking right now. We handle verification so tenants trust you from day one.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lg hover:bg-neutral-50">
                  List your property free →
                </Link>
                <Link href="/login" className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline">Already have an account? Log in</Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
                <span>✓ Free to list</span>
                <span>✓ ID verification required</span>
                <span>✓ Direct student enquiries</span>
              </div>
            </div>
          </div>
        </section>

  
    </>
  );
}
