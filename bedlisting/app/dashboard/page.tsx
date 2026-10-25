import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">
        Welcome back, {session?.user.name?.split(" ")[0]}
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/properties"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          Browse properties
        </Link>
        <Link
          href="/messages"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          Your messages
        </Link>
        <Link
          href="/saved"
          className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
        >
          Saved properties
        </Link>
      </div>
    </div>
  );
}
