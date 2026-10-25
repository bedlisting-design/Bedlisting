import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadPropertyPhoto, uploadIdDocument } from "@/lib/cloudinary";
import { isListerRole } from "@/lib/format";
import { requireVerifiedEmail } from "@/lib/emailGate";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Only landlords, agents and admins ever upload photos or documents.
  if (!isListerRole(session.user.role) && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const gate = await requireVerifiedEmail(session);
  if (gate) return gate;

  const { base64, kind } = await req.json();
  if (!base64 || !kind) {
    return NextResponse.json({ error: "base64 and kind are required." }, { status: 400 });
  }
  if (kind !== "photo" && kind !== "id_document") {
    return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  }
  if (typeof base64 !== "string" || base64.length > 4_000_000) {
    return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  }

  try {
    const url =
      kind === "id_document"
        ? await uploadIdDocument(base64)
        : await uploadPropertyPhoto(base64);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
