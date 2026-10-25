import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { SIGNUP_BONUS_CREDITS } from "@/lib/pricing";
import { notifyVerifyEmail } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role, budget, preferredCity, moveDate } =
      parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
        budget,
        preferredCity,
        moveDate: moveDate ? new Date(moveDate) : undefined,
        // Free starter credits for people looking for a property. These never
        // earn a lister money, so fake sign-ups can't be used to farm payouts.
        ...(role === "TENANT"
          ? {
              bonusBalance: SIGNUP_BONUS_CREDITS,
              creditTransactions: {
                create: {
                  type: "SIGNUP_BONUS" as const,
                  bonusDelta: SIGNUP_BONUS_CREDITS,
                  note: "Welcome bedcoins",
                },
              },
            }
          : {}),
      },
    });

    await notifyVerifyEmail(user.id);

    return NextResponse.json(
      { id: user.id, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
