import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

export default async function SavedPropertiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const saved = await prisma.savedProperty.findMany({
    where: { userId: session.user.id, property: { status: "APPROVED" } },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Saved properties</h1>
      {saved.length === 0 ? (
        <p className="text-neutral-500">
          Nothing saved yet. Tap save on a property to keep it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {saved.map((s) => (
            <Link
              key={s.id}
              href={`/properties/${s.property.id}`}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
            >
              {s.property.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.property.photos[0]}
                  alt={s.property.title}
                  className="mb-3 h-40 w-full rounded-md object-cover"
                />
              )}
              <h3 className="font-medium">{s.property.title}</h3>
              <p className="text-sm text-neutral-500">
                {s.property.city}, {s.property.state}
              </p>
              <p className="mt-1 font-semibold">
                {formatPrice(s.property)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
