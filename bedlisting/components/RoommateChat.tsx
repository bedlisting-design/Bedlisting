"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; content: string; createdAt: string; mine: boolean };

export default function RoommateChat({ connectionId }: { connectionId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/roommates/connections/${connectionId}/messages`);
    if (res.ok) setMessages(await res.json());
  }, [connectionId]);

  // Simple polling: new messages show up within about 10 seconds.
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/roommates/connections/${connectionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setSending(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not send.");
      return;
    }
    setText("");
    load();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="h-96 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-neutral-400">Say hello and talk about what matters to you both.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-800"}`}>
              {m.content}
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-neutral-200 p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Write a message"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm" />
        <button disabled={sending || !text.trim()} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Send
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
