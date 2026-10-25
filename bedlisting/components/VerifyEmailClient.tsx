"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type State = "working" | "ok" | "expired" | "invalid";

export default function VerifyEmailClient({ token }: { token: string }) {
  const { data: session } = useSession();
  const [state, setState] = useState<State>("working");
  const [resent, setResent] = useState("");

  // Confirmed from the browser (not on page load on the server), so link scanners
  // that only fetch the page do not use up the token.
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch("/api/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => setState(d.result ?? "invalid"))
      .catch(() => setState("invalid"));
  }, [token]);

  async function resend() {
    setResent("Sending...");
    const res = await fetch("/api/email/resend", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setResent(res.ok ? "A new link is on its way. Check your inbox." : d.error || "Could not send a new link.");
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center">
      {state === "working" && <p className="text-neutral-600">Confirming your email...</p>}

      {state === "ok" && (
        <>
          <p className="text-4xl">✅</p>
          <h1 className="mt-2 text-xl font-semibold">Email confirmed</h1>
          <p className="mt-2 text-neutral-600">You can now unlock listings, message people and buy bedcoins.</p>
          {/* A full page load, so the banner disappears. */}
          <a href="/properties" className="mt-5 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
            Browse lodges
          </a>
        </>
      )}

      {(state === "expired" || state === "invalid") && (
        <>
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-2 text-xl font-semibold">
            {state === "expired" ? "This link has expired" : "This link did not work"}
          </h1>
          <p className="mt-2 text-neutral-600">
            It may have been used already or is out of date. If your banner is gone, you are all set.
            Otherwise, get a new link.
          </p>
          {session ? (
            <>
              <button onClick={resend} className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
                Send me a new link
              </button>
              {resent && <p className="mt-3 text-sm text-neutral-600">{resent}</p>}
            </>
          ) : (
            <Link href="/login?callbackUrl=/verify-email" className="mt-5 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
              Log in to get a new link
            </Link>
          )}
        </>
      )}
    </div>
  );
}
