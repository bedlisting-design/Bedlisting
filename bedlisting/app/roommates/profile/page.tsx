import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoommateProfileForm, { blankRoommate } from "@/components/RoommateProfileForm";

export default async function RoommateProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const p = await prisma.roommateProfile.findUnique({ where: { userId: session.user.id } });

  return (
    <RoommateProfileForm
      editing={!!p}
      initial={
        p
          ? {
              mode: p.mode, gender: p.gender, genderPref: p.genderPref, area: p.area,
              budgetMin: String(p.budgetMin), budgetMax: String(p.budgetMax),
              moveDate: p.moveDate ? p.moveDate.toISOString().slice(0, 10) : "",
              sleep: p.sleep, cleanliness: p.cleanliness, smokes: p.smokes, smokingOk: p.smokingOk,
              visitors: p.visitors, bio: p.bio ?? "", roomDetails: p.roomDetails ?? "", active: p.active,
            }
          : blankRoommate
      }
    />
  );
}
