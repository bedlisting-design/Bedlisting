import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOOST_OPTIONS } from "@/lib/pricing";
import { spendCredits, InsufficientCreditsError } from "@/lib/credits";

// A lister spends their own bedcoins to feature a listing. bedlisting keeps 100%.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { days } = await req.json().catch(() => ({}));
  const option = BOOST_OPTIONS.find((o) => o.days === Number(days));
  if (!option) return NextResponse.json({ error: "Invalid boost option." }, { status: 400 });

  const isAdmin = session.user.role === "ADMIN";
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property || (property.landlordId !== session.user.id && !isAdmin)) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }
  if (property.status !== "APPROVED") {
    return NextResponse.json({ error: "Only live listings can be boosted." }, { status: 400 });
  }

  try {
    const featuredUntil = await prisma.$transaction(async (tx) => {
      // Admins feature listings for free; everyone else pays from their own bedcoins.
      if (!isAdmin) {
        const { paidSpent, bonusSpent } = await spendCredits(tx, session.user.id, option.cost);
        await tx.creditTransaction.create({
          data: {
            userId: session.user.id,
            type: "BOOST_SPEND",
            paidDelta: -paidSpent,
            bonusDelta: -bonusSpent,
            propertyId: property.id,
            note: `Featured for ${option.days} days`,
          },
        });
      }
      // Stacks on top of any boost that is still running.
      const start = property.featuredUntil && property.featuredUntil > new Date()
        ? property.featuredUntil
        : new Date();
      const until = new Date(start.getTime() + option.days * 24 * 60 * 60 * 1000);
      await tx.property.update({ where: { id: property.id }, data: { featuredUntil: until } });
      return until;
    });
    return NextResponse.json({ success: true, featuredUntil });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `You need ${option.cost} bedcoins for this boost.`, needCredits: option.cost },
        { status: 402 }
      );
    }
    console.error("Boost error:", err);
    return NextResponse.json({ error: "Could not boost the listing." }, { status: 500 });
  }
}
