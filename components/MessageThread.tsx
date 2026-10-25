"use client";

import { useEffect, useState } from "react";

type ThreadMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isSelf: boolean;
  senderDisplay: string;
  senderContact: string | null;
};

export default function MessageThread({
  propertyId,
  otherUserId,
}: {
  propertyId: string;
  otherUserId: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/messages?propertyId=${propertyId}&otherUserId=${otherUserId}`);
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [propertyId, otherUserId]);

  async function sendReply() {
    if (!reply.trim()) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, receiverId: otherUserId, content: reply }),
    });
    setReply("");
    load();
  }

  async function shareContact() {
    await fetch("/api/messages/share-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, otherUserId }),
    });
    load();
  }

  const contactShared = messages.some((m) => m.senderContact);

  if (loading) return <p className="text-neutral-500">Loading conversation...</p>;

  return (
    <div>
      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.isSelf ? "text-right" : "text-left"}>
            <p className="text-xs text-neutral-500">{m.senderDisplay}</p>
            <p
              className={`inline-block max-w-xs rounded-lg px-3 py-2 text-sm ${
                m.isSelf ? "bg-brand-600 text-white" : "bg-neutral-100"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
      </div>

      {!contactShared && (
        <button
          onClick={shareContact}
          className="mt-3 text-sm text-brand-700 underline"
        >
          Share my contact details with this person
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          onClick={sendReply}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
