import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { formatPrice } from "@/lib/format";
import AdminListingActions from "@/components/AdminListingActions";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const session = await requireAdmin();
  if (!session) return null;

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { unlocks: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Official listings</h1>
          <p className="text-sm text-neutral-500">
            Properties posted by bedlisting. They go live at once and show the Official tag.
          </p>
        </div>
        <Link href="/admin/properties/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
          Post a listing
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="text-neutral-500">No official listings yet.</p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-medium">
                {p.title} <span className="text-xs text-neutral-400">{p.status}</span>
              </p>
              <p className="text-sm text-neutral-500">
                {p.city}, {p.state} · {formatPrice(p)} · {p._count.unlocks} paid view{p._count.unlocks === 1 ? "" : "s"}
              </p>
              <AdminListingActions id={p.id} status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
