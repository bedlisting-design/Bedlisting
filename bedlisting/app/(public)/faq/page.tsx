import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/content/faq";

export const metadata: Metadata = { title: "FAQ · bedlisting" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mb-8 mt-2 text-neutral-500">
        Quick answers about browsing, bedcoins, listing and staying safe. Still stuck? Email us from
        the footer.
      </p>

      {FAQ.map((group) => (
        <section key={group.title} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <details key={item.q} className="group rounded-xl border border-neutral-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="mr-2 text-brand-600 group-open:hidden">+</span>
                  <span className="mr-2 hidden text-brand-600 group-open:inline">−</span>
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-neutral-500">
        Read the full <Link href="/terms" className="text-brand-700 underline">Terms and Conditions</Link>.
      </p>
    </div>
  );
}
