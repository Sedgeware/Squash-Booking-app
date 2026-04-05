import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/membership/activate
 * Stub endpoint — activates a membership directly without real Stripe.
 * Replace with actual Stripe Checkout session creation when ready.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Check if already active
  const existing = await prisma.membership.findFirst({
    where: { userId, status: "ACTIVE", currentPeriodEnd: { gte: new Date() } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already have an active membership." }, { status: 409 });
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const membership = await prisma.membership.create({
    data: {
      userId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      // stripeCustomerId and stripeSubscriptionId would be set by Stripe webhook
    },
  });

  return NextResponse.json(membership, { status: 201 });
}
