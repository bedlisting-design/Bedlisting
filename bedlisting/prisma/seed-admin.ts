import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Creates (or resets the password of) an admin account.
 * Admins cannot be created through the public sign-up form.
 *
 *   ADMIN_EMAIL=you@bedlisting.com ADMIN_PASSWORD='a-long-password' npm run db:seed-admin
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "bedlisting Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "ADMIN") {
    throw new Error(
      `${email} already belongs to a ${existing.role} account. Use a different admin email.`
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { password: hashed, status: "ACTIVE", emailVerified: new Date() },
    create: { name, email, password: hashed, role: "ADMIN", emailVerified: new Date() },
  });

  console.log(`Admin ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
