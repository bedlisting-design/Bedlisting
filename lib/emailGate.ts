import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Use right after the session check in any route that spends or publishes:
 *   const gate = await requireVerifiedEmail(session);
 *   if (gate) return gate;
 * Admins are exempt. Everyone else must have clicked their confirmation link.
 */
export async function requireVerifiedEmail(session: { user: { id: string; role: string } }) {
  if (session.user.role === "ADMIN") return null;
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (u?.emailVerified) return null;
  return NextResponse.json(
    {
      error:
        "Confirm your email address first. Check your inbox (and spam) for our link, or use Resend in the banner at the top of the page.",
      needEmailVerification: true,
    },
    { status: 403 }
  );
}
