import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { notifyPayoutResult } from "@/lib/notify";

// Admin pays the lister (bank transfer / Paystack dashboard) and then marks it here,
// or rejects it, which puts the earnings back as available.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { action, reference, note } = await req.json().catch(() => ({}));
  if (action !== "PAID" && action !== "REJECT") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action === "PAID" && !reference) {
    return NextResponse.json({ error: "Enter the transfer reference." }, { status: 400 });
  }

  const ok = await prisma.$transaction(async (tx) => {
    const flipped = await tx.payoutRequest.updateMany({
      where: { id: params.id, status: "REQUESTED" },
      data: {
        status: action === "PAID" ? "PAID" : "REJECTED",
        reference: action === "PAID" ? String(reference) : undefined,
        adminNote: note ? String(note) : undefined,
        processedAt: new Date(),
      },
    });
    if (flipped.count === 0) return false;

    if (action === "PAID") {
      await tx.earning.updateMany({ where: { payoutId: params.id }, data: { status: "PAID_OUT" } });
    } else {
      await tx.earning.updateMany({
        where: { payoutId: params.id },
        data: { status: "HELD", payoutId: null },
      });
    }
    return true;
  });

  if (!ok) return NextResponse.json({ error: "Already processed." }, { status: 409 });
  await notifyPayoutResult(params.id, action === "PAID" ? "PAID" : "REJECTED");
  return NextResponse.json({ success: true });
}
