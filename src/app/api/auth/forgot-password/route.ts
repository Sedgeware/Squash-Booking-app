import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

// Identical response whether the email exists or not — prevents user enumeration.
const GENERIC_OK = {
  message:
    "If an account exists for that email, we've sent password reset instructions.",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal that no account exists for this email.
      console.log("[forgot-password] no user found — returning generic ok");
      return NextResponse.json(GENERIC_OK);
    }

    // Revoke any existing unused reset tokens for this user before creating a fresh one.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a cryptographically secure token.
    // Only the SHA-256 hash is persisted — the raw token travels in the email URL only.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    console.log("[forgot-password] token created for user", user.id);

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, rawToken });
      console.log("[forgot-password] reset email sent to", user.email);
    } catch (err) {
      console.error("[forgot-password] sendPasswordResetEmail threw:", err);
      // Email failure does not expose error to client — return generic ok.
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
