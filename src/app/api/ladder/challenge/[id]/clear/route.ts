import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ladder/challenge/[id]/clear
 * Soft-hide a CANCELLED challenge from the current user's My Challenges list.
 * Each side can clear independently; the record is never deleted.
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
    if (challenge.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only cancelled challenges can be cleared." },
        { status: 409 }
      );
    }

    const isChallenger = challenge.challenger.userId === session.user.id;
    const isChallenged = challenge.challenged.userId === session.user.id;

    if (!isChallenger && !isChallenged) {
      return NextResponse.json({ error: "Not a participant in this challenge." }, { status: 403 });
    }

    await prisma.ladderChallenge.update({
      where: { id },
      data: isChallenger
        ? { hiddenByChallenger: true }
        : { hiddenByChallenged: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[clear] unexpected error", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
