import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const INVALID_TOKEN_ERROR =
  "This reset link is invalid or has expired. Please request a new one.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body as {
      token?: string;
      newPassword?: string;
    };

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Hash the incoming token and look it up — raw tokens are never stored.
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // Reject if token not found, already used, or expired.
    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json({ error: INVALID_TOKEN_ERROR }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark token used atomically.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log("[reset-password] password reset completed for user", resetToken.userId);
    return NextResponse.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("[reset-password] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
