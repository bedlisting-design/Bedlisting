import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signVideoUpload } from "@/lib/cloudinary";
import { isListerRole } from "@/lib/format";

// Gives a lister a short-lived, locked-down permission to upload ONE video
// straight to Cloudinary (video formats only, into our private video folder).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (!isListerRole(session.user.role) && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Only landlords and agents can upload videos." }, { status: 403 });
  }
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Video upload is not configured yet." }, { status: 503 });
  }
  return NextResponse.json(signVideoUpload());
}
