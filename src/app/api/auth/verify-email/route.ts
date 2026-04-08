import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

const APP_URL = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * GET /api/auth/verify-email?token=<token>
 * Validates the token, marks the user as verified, and redirects to login.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid-token`);
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    // Token not found or already used
    return NextResponse.redirect(`${APP_URL}/login?error=invalid-token`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
  });

  // Now that they're verified, send the welcome email
  sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) =>
    console.error("[email] welcome email after verification failed:", err)
  );

  return NextResponse.redirect(`${APP_URL}/login?verified=1`);
}
