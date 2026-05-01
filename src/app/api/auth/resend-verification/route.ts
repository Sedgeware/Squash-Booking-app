import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 * Body: { email: string }
 *
 * Generates a fresh token and resends the verification email.
 * Only acts if the user exists and is not yet verified.
 * Always returns 200 to avoid leaking whether an email is registered.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("[resend-verification] no user found for", email);
      return NextResponse.json({ ok: true });
    }

    if (user.emailVerified) {
      console.log("[resend-verification] user already verified:", email);
      return NextResponse.json({ ok: true });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    console.log("[resend-verification] sending verification email to", email);
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });
      console.log("[resend-verification] verification email sent to", email);
    } catch (err) {
      console.error("[resend-verification] sendVerificationEmail threw for", email, err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
