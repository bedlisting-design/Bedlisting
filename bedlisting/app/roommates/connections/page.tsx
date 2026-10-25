import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskName } from "@/lib/format";
import ConnectionActions from "@/components/ConnectionActions";

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const me = session.user.id;

  const all = await prisma.roommateConnection.findMany({
    where: { OR: [{ requesterId: me }, { targetId: me }], status: { in: ["PENDING", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true, roommateProfile: { select: { area: true } } } },
      target: { select: { name: true, roommateProfile: { select: { area: true } } } },
    },
  });

  const received = all.filter((c) => c.status === "PENDING" && c.targetId === me);
  const sent = all.filter((c) => c.status === "PENDING" && c.requesterId === me);
  const chats = all.filter((c) => c.status === "ACCEPTED");
  const other = (c: (typeof all)[number]) => (c.requesterId === me ? c.target : c.requester);

  const row = (c: (typeof all)[number], extra: React.ReactNode) => (
    <div key={c.id} className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="font-medium">{maskName(other(c).name)}</p>
      <p className="text-sm text-neutral-500">{other(c).roommateProfile?.area ?? ""}</p>
      {extra}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">My connections</h1>

      <h2 className="mb-2 font-semibold">Requests for you ({received.length})</h2>
      <div className="mb-8 space-y-2">
        {received.length === 0 && <p className="text-sm text-neutral-500">No new requests.</p>}
        {received.map((c) => row(c, <ConnectionActions id={c.id} kind="received" />))}
      </div>

      <h2 className="mb-2 font-semibold">Chats ({chats.length})</h2>
      <div className="mb-8 space-y-2">
        {chats.length === 0 && <p className="text-sm text-neutral-500">No chats yet.</p>}
        {chats.map((c) =>
          row(c, <Link href={`/roommates/connections/${c.id}`} className="mt-2 inline-block text-sm text-brand-700 underline">Open chat</Link>)
        )}
      </div>

      <h2 className="mb-2 font-semibold">Waiting for a reply ({sent.length})</h2>
      <div className="space-y-2">
        {sent.length === 0 && <p className="text-sm text-neutral-500">Nothing waiting.</p>}
        {sent.map((c) => row(c, <ConnectionActions id={c.id} kind="sent" />))}
      </div>

      <p className="mt-8 text-sm"><Link href="/roommates" className="text-brand-700 underline">Back to matches</Link></p>
    </div>
  );
}
