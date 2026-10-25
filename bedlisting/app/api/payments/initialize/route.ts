import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackage, toKobo } from "@/lib/pricing";
import { requireVerifiedEmail } from "@/lib/emailGate";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const { packageId } = await req.json().catch(() => ({}));
  const pkg = getPackage(String(packageId));
  if (!pkg) return NextResponse.json({ error: "Unknown package." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Price and credits come from OUR config, never from the request.
  const reference = `bl_${Date.now()}_${randomBytes(6).toString("hex")}`;
  const amountKobo = toKobo(pkg.priceNaira);

  await prisma.payment.create({
    data: { reference, userId: user.id, packageId: pkg.id, credits: pkg.credits, amountKobo },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: `${baseUrl}/credits`,
      metadata: { userId: user.id, packageId: pkg.id },
    }),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.status || !json?.data?.authorization_url) {
    await prisma.payment.update({ where: { reference }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Could not start the payment. Try again." }, { status: 502 });
  }

  return NextResponse.json({ url: json.data.authorization_url, reference });
}
