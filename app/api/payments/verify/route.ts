import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfilPayment } from "@/lib/payments";

// Called by /credits when the buyer comes back from Paystack.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "reference required." }, { status: 400 });

  // A user can only verify their own payments.
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const result = await fulfilPayment(reference);
  return NextResponse.json(result);
}
