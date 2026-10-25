import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compatibility } from "@/lib/roommates";
import RoommateCard from "@/components/RoommateCard";
import RoommateSafety from "@/components/RoommateSafety";
import { ROOMMATE_CONNECT_COST } from "@/lib/pricing";
import type { ConnectState } from "@/components/ConnectButton";

export default async function RoommatesPage({ searchParams }: { searchParams: { mode?: string; q?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const me = session.user.id;

  const mine = await prisma.roommateProfile.findUnique({ where: { userId: me } });

  if (!mine) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Find a roommate you will actually get on with</h1>
        <p className="mt-3 text-neutral-600">
          Tell us your area, budget and how you live. We match you with people who fit, and never show
          your contact details or a photo. Creating a profile and seeing matches is free. Sending a request
          costs {ROOMMATE_CONNECT_COST} bedcoins, returned if they decline or do not reply.
        </p>
        <Link href="/roommates/profile" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Create my roommate profile
        </Link>
        <div className="mt-8 text-left"><RoommateSafety /></div>
      </div>
    );
  }

  const mode = searchParams.mode === "NEED_ROOM" || searchParams.mode === "HAVE_ROOM" ? searchParams.mode : undefined;
  const q = searchParams.q?.trim();

  const [others, connections] = await Promise.all([
    prisma.roommateProfile.findMany({
      where: {
        active: true,
        userId: { not: me },
        mode,
        area: q ? { contains: q, mode: "insensitive" } : undefined,
      },
      include: { user: { select: { id: true, name: true } } },
      take: 300,
    }),
    prisma.roommateConnection.findMany({
      where: { OR: [{ requesterId: me }, { targetId: me }] },
      select: { id: true, requesterId: true, targetId: true, status: true },
    }),
  ]);

  const stateFor = (otherId: string): { state: ConnectState; id?: string } => {
    const cs = connections.filter((c) => c.requesterId === otherId || c.targetId === otherId);
    const accepted = cs.find((c) => c.status === "ACCEPTED");
    if (accepted) return { state: "connected", id: accepted.id };
    if (cs.some((c) => c.requesterId === otherId && c.status === "PENDING")) return { state: "received" };
    if (cs.some((c) => c.requesterId === me && c.status === "PENDING")) return { state: "sent" };
    if (cs.some((c) => c.requesterId === me && c.status === "DECLINED")) return { state: "declined" };
    return { state: "none" };
  };

  const matches = others
    .map((o) => ({ o, c: compatibility(mine, o) }))
    .filter((m) => m.c.ok)
    .sort((a, b) => b.c.score - a.c.score)
    .slice(0, 50);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Roommate matches</h1>
          <p className="text-sm text-neutral-500">Best matches first. Only people who fit your preferences, and you fit theirs.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/roommates/connections" className="text-brand-700 underline">My connections</Link>
          <Link href="/roommates/profile" className="text-brand-700 underline">Edit my profile</Link>
        </div>
      </div>

      {!mine.active && (
        <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Your profile is paused, so other people can&apos;t see you. Turn it back on in Edit my profile.
        </p>
      )}

      <form className="mb-6 flex flex-wrap gap-2">
        <select name="mode" defaultValue={mode ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Everyone</option>
          <option value="NEED_ROOM">Looking for a place</option>
          <option value="HAVE_ROOM">Has a place to share</option>
        </select>
        <input name="q" defaultValue={q} placeholder="Search an area, e.g. Hilltop" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Filter</button>
      </form>

      {matches.length === 0 ? (
        <p className="text-neutral-500">No matches yet. New people join all the time, so check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map(({ o, c }) => {
            const s = stateFor(o.userId);
            return (
              <RoommateCard key={o.id} userId={o.userId} name={o.user.name} profile={o}
                score={c.score} reasons={c.reasons} state={s.state} connectionId={s.id} />
            );
          })}
        </div>
      )}

      <div className="mt-8"><RoommateSafety /></div>
    </div>
  );
}
