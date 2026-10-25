import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLimited, recordFailure, clearFailures } from "@/lib/rateLimit";
import { notifyPasswordChanged } from "@/lib/notify";

// Any signed-in user (including admins on the admin site) can change their own password.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  const minLength = session.user.role === "ADMIN" ? 12 : 8;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Both passwords are required." }, { status: 400 });
  }
  if (newPassword.length < minLength) {
    return NextResponse.json({ error: `The new password must be at least ${minLength} characters.` }, { status: 400 });
  }

  const key = `pw:${session.user.id}`;
  if (await isLimited([{ key, max: 5 }])) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    await recordFailure([key]);
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  });
  await clearFailures(key);
  await notifyPasswordChanged(user.id);
  return NextResponse.json({ success: true });
}
