"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import EmailVerifyBanner from "@/components/EmailVerifyBanner";

/**
 * Wraps every page. The homepage is full-width (the design has its own
 * sections); every other page keeps the standard centered container.
 * The admin area gets its own plain bar and no public footer.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const home = pathname === "/";

  return (
    <>
      {!admin && <TopBar />}
      <Navbar />
      {!admin && <EmailVerifyBanner />}
      {home ? <main>{children}</main> : <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>}
      {!admin && <Footer />}
    </>
  );
}
