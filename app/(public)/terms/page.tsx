import type { Metadata } from "next";
import LegalText from "@/components/LegalText";
import { TERMS_TEXT } from "@/content/terms";
import { SUPPORT_EMAIL, BUSINESS_ADDRESS, TERMS_EFFECTIVE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms and Conditions · bedlisting" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions of Use</h1>
      <p className="mb-8 mt-2 text-sm text-neutral-500">
        Effective date: {TERMS_EFFECTIVE} · Last updated: {TERMS_EFFECTIVE}
      </p>

      <LegalText text={TERMS_TEXT} />

      <div className="mt-10 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900">bedlisting</p>
        <p>Email: {SUPPORT_EMAIL}</p>
        <p>Business address: {BUSINESS_ADDRESS}</p>
      </div>
    </article>
  );
}
