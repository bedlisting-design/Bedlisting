import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;

/** True if any key has used up its failed attempts in the last 15 minutes. */
export async function isLimited(checks: { key: string; max: number }[]) {
  const since = new Date(Date.now() - WINDOW_MS);
  for (const c of checks) {
    const n = await prisma.loginAttempt.count({ where: { key: c.key, createdAt: { gte: since } } });
    if (n >= c.max) return true;
  }
  return false;
}

export async function recordFailure(keys: string[]) {
  await prisma.loginAttempt.createMany({ data: keys.map((key) => ({ key })) });
  // Housekeeping: forget anything older than a day.
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function clearFailures(key: string) {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}
