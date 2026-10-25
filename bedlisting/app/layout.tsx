import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "bedlisting — Bedspaces & self-cons near UNN Nsukka",
  description:
    "Find real bedspaces and self-cons near UNN Nsukka from ID-checked landlords and agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f7] text-neutral-900 antialiased">
        <SessionProvider>
          <SiteShell>{children}</SiteShell>
        </SessionProvider>
      </body>
    </html>
  );
}
