"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeNext } from "@/lib/safeRedirect";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("/");
  const [justRegistered, setJustRegistered] = useState(false);

  // Read the address bar after load (no useSearchParams, so the page can stay static).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(safeNext(q.get("callbackUrl")));
    setJustRegistered(q.get("registered") === "true");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      {justRegistered && (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Account created. Log in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-4 py-2"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-4 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-500">
        New to bedlisting?{" "}
        <Link
          href={next === "/" ? "/register" : `/register?callbackUrl=${encodeURIComponent(next)}`}
          className="text-brand-700 underline"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}
