import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/format";
import MessageThread from "@/components/MessageThread";

export default async function MessageThreadView({
  propertyId,
  withUserId,
}: {
  propertyId: string;
  withUserId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, landlordId: true },
  });
  if (!property) notFound();

  // Seekers talk to the lister. A lister talks to whoever the thread is with.
  let otherUserId = property.landlordId;
  if (session.user.id === property.landlordId) {
    if (withUserId) {
      otherUserId = withUserId;
    } else {
      const first = await prisma.message.findFirst({
        where: { propertyId: property.id, senderId: { not: property.landlordId } },
        orderBy: { createdAt: "asc" },
      });
      if (!first) notFound();
      otherUserId = first.senderId;
    }
  }

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { name: true, role: true },
  });
  if (!other) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold">{property.title}</h1>
      <p className="mb-4 text-sm text-neutral-500">Conversation with {displayUserName(other)}</p>
      <MessageThread propertyId={property.id} otherUserId={otherUserId} />
    </div>
  );
}
