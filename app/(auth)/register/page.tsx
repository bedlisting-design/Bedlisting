"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/login?registered=true");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>

      <div className="mb-6 flex rounded-md border border-neutral-300 p-1">
        {(["TENANT", "LANDLORD"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded py-2 text-sm ${
              role === r ? "bg-brand-600 text-white" : "text-neutral-600"
            }`}
          >
            {r === "TENANT" ? "Looking for a property" : "Landlord"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-4 py-2"
        />
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
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-4 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-3 text-xs text-neutral-500">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="underline">Terms and Conditions</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>. See the{" "}
        <Link href="/faq" className="underline">FAQ</Link> for how bedcoins work.
      </p>

      {role === "TENANT" && (
        <p className="mt-4 text-sm text-neutral-500">
          Browsing is free. New accounts get free bedcoins to unlock your first property.
        </p>
      )}
      {role !== "TENANT" && (
        <p className="mt-4 text-sm text-neutral-500">
          You&apos;ll need to submit an ID for verification before you can list a
          property or withdraw earnings. This protects people from fake listings.
          You earn money when people unlock your listings.
        </p>
      )}
    </div>
  );
}
