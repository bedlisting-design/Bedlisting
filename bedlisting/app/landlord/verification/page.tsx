"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUploadInput from "@/components/FileUploadInput";

export default function VerificationPage() {
  const router = useRouter();
  const [idType, setIdType] = useState("national_id");
  const [idUrl, setIdUrl] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!idUrl) {
      setError("Upload your ID document first.");
      return;
    }
    setError("");

    const res = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idDocumentUrl: idUrl, idType }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-brand-200 bg-brand-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-brand-800">Submitted for review</h1>
        <p className="mt-2 text-sm text-brand-700">
          An admin will review your ID. You can list a property once it&apos;s
          approved. This is usually within 24 hours.
        </p>
        <button
          onClick={() => router.push("/landlord/dashboard")}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm text-white"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-semibold">Verify your identity</h1>
      <p className="mb-6 text-sm text-neutral-600">
        This protects tenants from fake listings and is required before you
        can publish a property. Your document is stored privately and only
        visible to admin reviewers.
      </p>

      <div className="space-y-4">
        <select
          value={idType}
          onChange={(e) => setIdType(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        >
          <option value="national_id">National ID</option>
          <option value="drivers_license">Driver&apos;s license</option>
        </select>

        <FileUploadInput
          label="Upload your ID"
          kind="id_document"
          onUploaded={(urls) => setIdUrl(urls[0])}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700"
        >
          Submit for review
        </button>
      </div>
    </div>
  );
}
