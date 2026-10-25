import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/format";

/** Inbox: one row per property AND per person, so every interested user gets their own thread. */
export default async function MessagesInbox({ basePath }: { basePath: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const me = session.user.id;

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, title: true } },
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  });

  const threads = new Map<string, { m: (typeof messages)[number]; other: { id: string; name: string; role: string } }>();
  for (const m of messages) {
    const other = m.senderId === me ? m.receiver : m.sender;
    const key = `${m.propertyId}:${other.id}`;
    if (!threads.has(key)) threads.set(key, { m, other });
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Messages</h1>
      {threads.size === 0 ? (
        <p className="text-neutral-500">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {Array.from(threads.entries()).map(([key, { m, other }]) => (
            <Link
              key={key}
              href={`${basePath}/${m.propertyId}?with=${other.id}`}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md"
            >
              <p className="font-medium">
                {m.property.title} <span className="text-sm font-normal text-neutral-500">· {displayUserName(other)}</span>
              </p>
              <p className="truncate text-sm text-neutral-500">{m.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
