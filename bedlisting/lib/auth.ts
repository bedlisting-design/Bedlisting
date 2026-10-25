import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isLimited, recordFailure, clearFailures } from "@/lib/rateLimit";

type Portal = "user" | "admin";

/**
 * Shared credential check. The two portals are strictly separated:
 *  - the user portal REJECTS admin accounts
 *  - the admin portal ONLY ACCEPTS admin accounts
 * Wrong-portal attempts get the same message as "no such account" so the
 * login forms never reveal whether an email belongs to an admin.
 */
async function verifyCredentials(
  credentials: Record<"email" | "password", string> | undefined,
  portal: Portal,
  req?: { headers?: Record<string, any> }
) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email and password are required.");
  }

  // Slow down password guessing: 5 misses per email, or 30 per network address, per 15 minutes.
  const email = credentials.email.toLowerCase();
  const ip = String(req?.headers?.["x-forwarded-for"] ?? "").split(",")[0].trim();
  const emailKey = `${portal}:${email}`;
  const ipKey = ip ? `ip:${ip}` : null;
  if (await isLimited([{ key: emailKey, max: 5 }, ...(ipKey ? [{ key: ipKey, max: 30 }] : [])])) {
    throw new Error("Too many failed attempts. Try again in 15 minutes.");
  }

  try {
    const result = await checkUser(credentials, portal);
    await clearFailures(emailKey);
    return result;
  } catch (err) {
    await recordFailure(ipKey ? [emailKey, ipKey] : [emailKey]);
    throw err;
  }
}

async function checkUser(
  credentials: Record<"email" | "password", string>,
  portal: Portal
) {
  const notFound =
    portal === "admin" ? "Invalid credentials." : "No account found with that email.";

  const user = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
  });

  if (!user) throw new Error(notFound);

  const wrongPortal = portal === "admin" ? user.role !== "ADMIN" : user.role === "ADMIN";
  if (wrongPortal) throw new Error(notFound);

  if (user.status === "SUSPENDED") {
    throw new Error(
      portal === "admin"
        ? "Invalid credentials."
        : "This account has been suspended. Contact support."
    );
  }

  const valid = await bcrypt.compare(credentials.password, user.password);
  if (!valid) {
    throw new Error(portal === "admin" ? "Invalid credentials." : "Incorrect password.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: !!user.emailVerified,
  };
}

const fields = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
} as const;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Tenants and landlords: used by /login on the main site.
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: fields,
      authorize: (credentials, req) => verifyCredentials(credentials, "user", req as any),
    }),
    // Admins only: used by /admin/login on the admin subdomain.
    CredentialsProvider({
      id: "admin-credentials",
      name: "admin-credentials",
      credentials: fields,
      authorize: (credentials, req) => verifyCredentials(credentials, "admin", req as any),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified;
        token.invalid = false;
        return token;
      }
      // Runs each time a session is read: a suspended or deleted account is signed out
      // straight away instead of staying signed in until the cookie expires.
      if (token.id) {
        const u = await prisma.user.findUnique({
          where: { id: token.id },
          select: { status: true, role: true, emailVerified: true },
        });
        if (!u || u.status === "SUSPENDED") {
          token.invalid = true;
        } else {
          token.invalid = false;
          token.role = u.role;
          token.emailVerified = !!u.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // An empty session counts as "not signed in" for getServerSession and useSession.
      if (token.invalid) return {} as typeof session;
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
