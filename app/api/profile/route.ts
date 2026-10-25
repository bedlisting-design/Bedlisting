import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

const select = {
  name: true, email: true, role: true, phone: true, bio: true,
  agencyName: true, licenseNumber: true, emailNotifications: true,
  verification: { select: { status: true } },
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const d = parsed.data;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      bio: d.bio || null,
      agencyName: d.agencyName || null,
      licenseNumber: d.licenseNumber || null,
      emailNotifications: d.emailNotifications,
    },
    select,
  });
  return NextResponse.json(user);
}
