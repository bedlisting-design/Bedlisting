import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EscortActions from "@/components/EscortActions";

export default async function EscortRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const requests = await prisma.escortRequest.findMany({
    where: { listerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { title: true, city: true } },
      seeker: { select: { name: true } },
    },
  });

  // Seekers appear as first name + last initial, same privacy rule as messages.
  const mask = (n: string) => {
    const parts = n.trim().split(" ");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold">Escort requests</h1>
      <p className="mb-6 text-sm text-neutral-500">
        People who paid to be taken to one of your properties. Accepting means you will meet them
        there. You earn once they confirm the visit.
      </p>

      {requests.length === 0 ? (
        <p className="text-neutral-500">No requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-medium">{r.property.title}</p>
              <p className="text-sm text-neutral-500">
                {mask(r.seeker.name)} · {r.preferredTime} · {r.status}
              </p>
              {r.note && <p className="mt-1 text-sm text-neutral-700">{r.note}</p>}
              {r.status === "REQUESTED" && <EscortActions id={r.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
