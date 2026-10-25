import Link from "next/link";

export default function Footer() {
  return (
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">🏠</span>
                <span className="text-base font-bold">bed<span className="text-brand-600">listing</span></span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
                The trusted marketplace for bedspaces, self-cons and lodges around University of Nigeria, Nsukka.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Explore</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li><Link href="/properties" className="hover:text-brand-700">All lodges</Link></li>
                <li><Link href="/properties?q=Hilltop" className="hover:text-brand-700">Hilltop</Link></li>
                <li><Link href="/properties?q=Odenigwe" className="hover:text-brand-700">Odenigwe</Link></li>
                <li><Link href="/properties?q=Odim" className="hover:text-brand-700">Odim</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Landlords</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li><Link href="/register" className="hover:text-brand-700">List a property</Link></li>
                <li><Link href="/#how" className="hover:text-brand-700">How bedcoins work</Link></li>
                <li><Link href="/login" className="hover:text-brand-700">Landlord login</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Support</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li><a href="mailto:support@bedlisting.com" className="hover:text-brand-700">support@bedlisting.com</a></li>
                <li><a href="tel:+2340000000000" className="hover:text-brand-700">+234 000 000 0000</a></li>
                <li><Link href="/faq" className="hover:text-brand-700">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-brand-700">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-brand-700">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-6 text-xs text-neutral-400 sm:flex-row">
            <p>© 2026 bedlisting. Built for Nsukka.</p>
            <p>ID-checked landlords.</p>
          </div>
        </div>
      </footer>
  );
}
