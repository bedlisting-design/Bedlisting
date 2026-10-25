import { NextResponse } from "next/server";
import { confirmEmail } from "@/lib/emailVerification";

// The token in the emailed link is the credential, so no sign-in is needed.
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  const result = await confirmEmail(String(token ?? ""));
  return NextResponse.json({ result }, { status: result === "ok" ? 200 : 400 });
}
