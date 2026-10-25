"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ContactLandlordBox({
  propertyId,
  landlordId,
}: {
  propertyId: string;
  landlordId: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState(
    "Hello, I am interested in this property."
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!session) {
      router.push("/login");
      return;
    }

    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        receiverId: landlordId,
        content: message,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not send message.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
        Message sent. They see you as your first name and last
        initial until you both agree to share contact details.{" "}
        <a href="/messages" className="underline">
          View your messages
        </a>
        .
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="mb-2 font-medium">Contact the owner</h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleSend}
        className="mt-3 w-full rounded-md bg-brand-600 py-2 text-sm text-white hover:bg-brand-700"
      >
        Send interest
      </button>
      <p className="mt-2 text-xs text-neutral-500">
        Your full name and contact details stay private until you choose to
        share them.
      </p>
    </div>
  );
}
