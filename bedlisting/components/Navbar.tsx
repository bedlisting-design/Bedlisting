"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

function AdminBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/admin/dashboard" className="text-lg font-semibold">
          bedlisting <span className="font-normal text-neutral-400">admin</span>
        </Link>

        {signedIn && (
          <nav className="flex flex-wrap items-center gap-5 text-sm">
            <Link href="/admin/dashboard">Overview</Link>
            <Link href="/admin/users">Users</Link>
            <Link href="/admin/listings">Listings</Link>
            <Link href="/admin/properties">My listings</Link>
            <Link href="/admin/messages">Messages</Link>
            <Link href="/admin/payouts">Payouts</Link>
            <Link href="/admin/reports">Reports</Link>
            <Link href="/admin/account">Account</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-neutral-400"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [coins, setCoins] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Live bedcoin balance. Components fire "bedcoins:changed" after any spend or purchase.
  const userId = session?.user?.id;
  const role = session?.user?.role;
  useEffect(() => {
    if (!userId || role === "ADMIN") {
      setCoins(null);
      return;
    }
    const load = () =>
      fetch("/api/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) setCoins(d.creditBalance + d.bonusBalance);
        })
        .catch(() => {});
    load();
    window.addEventListener("bedcoins:changed", load);
    return () => window.removeEventListener("bedcoins:changed", load);
  }, [userId, role, pathname]);

  // Admin area gets its own bar. Admin links never appear on the public site.
  if (pathname.startsWith("/admin")) {
    return <AdminBar signedIn={role === "ADMIN"} />;
  }

  const isLister = role === "LANDLORD" || role === "AGENT";
  const links: { href: string; label: string }[] = isLister
    ? [
        { href: "/landlord/dashboard", label: "Dashboard" },
        { href: "/landlord/properties/new", label: "Add property" },
        { href: "/messages", label: "Messages" },
        { href: "/landlord/earnings", label: "Earnings" },
        ...(role === "AGENT" ? [{ href: "/landlord/escorts", label: "Escort requests" }] : []),
        { href: "/roommates", label: "Roommates" },
        { href: "/credits", label: "Bedcoins" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        { href: "/messages", label: "Messages" },
        { href: "/saved", label: "Saved" },
        { href: "/roommates", label: "Roommates" },
        { href: "/credits", label: "Bedcoins" },
        { href: "/profile", label: "Profile" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">🏠</span>
          <div className="leading-none">
            <span className="text-lg font-bold tracking-tight">bed<span className="text-brand-600">listing</span></span>
            <p className="hidden text-[10px] font-medium text-neutral-400 sm:block">Nsukka · UNN</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
          <Link href="/properties" className="hover:text-brand-700">Browse lodges</Link>
          <Link href="/roommates" className="hover:text-brand-700">Roommates</Link>
          <Link href="/#how" className="hover:text-brand-700">How it works</Link>
          <Link href="/#landlord" className="hover:text-brand-700">For landlords</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {!session && (
            <>
              <Link href="/login" className="hidden md:inline text-sm font-medium text-neutral-600 hover:text-neutral-900">Log in</Link>
              <Link href="/register" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Sign up free</Link>
            </>
          )}

          {session && (
            <>
              {coins !== null && (
                <Link href="/credits" className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  🪙 {coins}
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-brand-600"
                >
                  {session.user.name.split(" ")[0]} ▾
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
                    <Link href="/properties" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-brand-50">
                      Browse lodges
                    </Link>
                    {links.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-brand-50">
                        {l.label}
                      </Link>
                    ))}
                    <button onClick={() => signOut()} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
