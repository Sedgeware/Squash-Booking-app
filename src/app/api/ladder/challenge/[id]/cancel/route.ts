import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ladder/challenge/[id]/cancel
 * Cancel an ACCEPTED challenge before a result is submitted.
 *
 * Either the challenger or the challenged player may cancel.
 * No rank changes are made — this purely voids the accepted match.
 * Both players are freed to issue/receive new challenges immediately.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;

    const challenge = await prisma.ladderChallenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { userId: true } },
        challenged: { select: { userId: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    const isChallenger = challenge.challenger.userId === session.user.id;
    const isChallenged = challenge.challenged.userId === session.user.id;

    if (!isChallenger && !isChallenged) {
      return NextResponse.json(
        { error: "Only a participant can cancel this challenge." },
        { status: 403 }
      );
    }

    if (challenge.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: `Cannot cancel a challenge that is ${challenge.status.toLowerCase()}.` },
        { status: 409 }
      );
    }

    await prisma.ladderChallenge.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[cancel] unexpected error", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
