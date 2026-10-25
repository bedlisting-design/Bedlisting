import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "bedlisting — Bedspaces & self-cons near UNN Nsukka",
  description:
    "Find real bedspaces and self-cons near UNN Nsukka from ID-checked landlords.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();",
          }}
        />
      </head>
      <body className="text-neutral-900 antialiased">
        <SessionProvider>
          <SiteShell>{children}</SiteShell>
        </SessionProvider>
      </body>
    </html>
  );
}
