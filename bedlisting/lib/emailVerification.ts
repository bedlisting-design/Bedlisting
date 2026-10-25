import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TTL_MS = 24 * 60 * 60 * 1000; // links work for 24 hours
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Makes a fresh link token for a user and forgets any older ones. Only the hash is stored. */
export async function createVerificationToken(userId: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const raw = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hash(raw), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return raw;
}

/** Confirms the address for whoever owns this token. A token works once. */
export async function confirmEmail(raw: string): Promise<"ok" | "invalid" | "expired"> {
  if (!/^[a-f0-9]{64}$/.test(raw)) return "invalid";

  const t = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!t) return "invalid";
  if (t.expiresAt < new Date()) {
    await prisma.emailVerificationToken.deleteMany({ where: { id: t.id } });
    return "expired";
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: t.userId } }),
  ]);
  return "ok";
}
