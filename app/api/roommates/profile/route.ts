import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roommateProfileSchema } from "@/lib/validators";
import { requireVerifiedEmail } from "@/lib/emailGate";

// Create or update my roommate profile.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Admins cannot create roommate profiles." }, { status: 403 });
  }
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const parsed = roommateProfileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;

  let moveDate: Date | null = null;
  if (d.moveDate) {
    moveDate = new Date(d.moveDate);
    if (isNaN(moveDate.getTime())) {
      return NextResponse.json({ error: "That move-in date is not valid." }, { status: 400 });
    }
  }

  const data = {
    mode: d.mode,
    gender: d.gender,
    genderPref: d.genderPref,
    area: d.area.trim(),
    budgetMin: d.budgetMin,
    budgetMax: d.budgetMax,
    moveDate,
    sleep: d.sleep,
    cleanliness: d.cleanliness,
    smokes: d.smokes,
    smokingOk: d.smokes || d.smokingOk, // a smoker is, of course, fine with smoke
    visitors: d.visitors,
    bio: d.bio || null,
    roomDetails: d.mode === "HAVE_ROOM" ? d.roomDetails || null : null,
    active: d.active,
  };

  const profile = await prisma.roommateProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });
  return NextResponse.json({ id: profile.id });
}

// Delete my roommate profile (open requests stay as they are).
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  await prisma.roommateProfile.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
