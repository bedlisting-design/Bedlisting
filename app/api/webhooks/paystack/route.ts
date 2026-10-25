import { NextResponse } from "next/server";
import crypto from "crypto";
import { fulfilPayment } from "@/lib/payments";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  // Read the RAW body: the signature is computed over the exact bytes sent.
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event === "charge.success" && event.data?.reference) {
    // fulfilPayment re-verifies with Paystack and is safe to run twice.
    await fulfilPayment(String(event.data.reference));
  }

  return NextResponse.json({ received: true });
}
