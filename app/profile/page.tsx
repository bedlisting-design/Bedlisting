import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";
import VerifiedBadge from "@/components/VerifiedBadge";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const roleLabel: Record<string, string> = {
  TENANT: "Looking for a property",
  LANDLORD: "Landlord",
  AGENT: "Agent",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, role: true, phone: true, bio: true,
      agencyName: true, licenseNumber: true, emailNotifications: true,
      verification: { select: { status: true } },
    },
  });
  if (!user) return null;

  const verified = user.verification?.status === "APPROVED";
  const lister = user.role === "LANDLORD" || user.role === "AGENT";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">
        {user.name}
        {verified && <VerifiedBadge label={user.role === "AGENT" ? "Verified agent" : "Verified"} />}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        {roleLabel[user.role] ?? user.role} · {user.email}
      </p>

      {lister && !verified && (
        <p className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          You are not verified yet.{" "}
          <Link href="/landlord/verification" className="underline">
            Submit your ID
          </Link>{" "}
          to get the verified check mark and be able to list and withdraw earnings.
        </p>
      )}

      <ProfileForm initial={user} isAgent={user.role === "AGENT"} />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Change password</h2>
      <ChangePasswordForm minLength={8} />
    </div>
  );
}
