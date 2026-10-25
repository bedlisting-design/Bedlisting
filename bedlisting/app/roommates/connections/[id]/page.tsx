import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskName } from "@/lib/format";
import { MODE_LABEL } from "@/lib/roommates";
import RoommateChat from "@/components/RoommateChat";
import RoommateSafety from "@/components/RoommateSafety";
import ReportButton from "@/components/ReportButton";

export default async function RoommateChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const me = session.user.id;

  const c = await prisma.roommateConnection.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, roommateProfile: true } },
      target: { select: { id: true, name: true, roommateProfile: true } },
    },
  });
  if (!c || (c.requesterId !== me && c.targetId !== me)) notFound();

  const other = c.requesterId === me ? c.target : c.requester;
  const p = other.roommateProfile;

  if (c.status !== "ACCEPTED") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-neutral-600">This conversation is not open yet.</p>
        <Link href="/roommates/connections" className="mt-3 inline-block text-brand-700 underline">Back to connections</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/roommates/connections" className="text-sm text-brand-700 underline">← My connections</Link>
      <h1 className="mt-2 text-xl font-semibold">{maskName(other.name)}</h1>
      {p && (
        <p className="mb-4 text-sm text-neutral-500">
          {MODE_LABEL[p.mode]} · {p.area} · ₦{p.budgetMin.toLocaleString()} to ₦{p.budgetMax.toLocaleString()} a year
        </p>
      )}
      <RoommateChat connectionId={c.id} />
      <div className="mt-4 text-center"><ReportButton reportedUserId={other.id} person /></div>
      <div className="mt-6"><RoommateSafety /></div>
    </div>
  );
}
