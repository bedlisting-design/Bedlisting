import { NextResponse } from "next/server";
import { notifyAdmins } from "@/lib/notify";
import { requireVerifiedEmail } from "@/lib/emailGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificationSchema } from "@/lib/validators";

// Landlord submits their ID for review.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "LANDLORD" && session.user.role !== "AGENT")) {
    return NextResponse.json(
      { error: "Only landlords and agents can submit verification." },
      { status: 403 }
    );
  }
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const body = await req.json();
  const parsed = verificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const verification = await prisma.verification.upsert({
    where: { userId: session.user.id },
    update: {
      idDocumentUrl: parsed.data.idDocumentUrl,
      idType: parsed.data.idType,
      status: "PENDING",
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      idDocumentUrl: parsed.data.idDocumentUrl,
      idType: parsed.data.idType,
    },
  });

  await notifyAdmins("ID submitted for review", `${session.user.name} (${session.user.role.toLowerCase()}) submitted an ID document.`, "/admin/users");
  return NextResponse.json(verification, { status: 201 });
}

// Landlord checks their own verification status.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const verification = await prisma.verification.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(verification || { status: "NOT_SUBMITTED" });
}
