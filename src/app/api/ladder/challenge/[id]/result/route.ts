import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { swapRanks, addHistory } from "@/lib/ladder";

/**
 * POST /api/ladder/challenge/[id]/result
 * Submit the result of an ACCEPTED challenge.
 *
 * Body: { winnerId: string (LadderPlayer id), score?: string, notes?: string }
 *
 * Authorization: challenger, challenged player, or admin may submit.
 * winner must be one of the two participants.
 *
 * If challenger wins → swap ranks.
 * If challenged wins → ranks unchanged.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { winnerId, score, notes } = body as {
    winnerId: string;
    score?: string;
    notes?: string;
  };

  if (!winnerId) {
    return NextResponse.json({ error: "winnerId is required." }, { status: 400 });
  }

  const challenge = await prisma.ladderChallenge.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, rank: true, userId: true } },
      challenged: { select: { id: true, rank: true, userId: true } },
    },
  });

  if (!challenge) return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  if (challenge.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: `Challenge must be ACCEPTED before submitting a result (current: ${challenge.status}).` },
      { status: 409 }
    );
  }

  // Already has a result?
  if (challenge.winnerId) {
    return NextResponse.json({ error: "Result already submitted for this challenge." }, { status: 409 });
  }

  // Authorization: challenger, challenged, or admin
  const isAdmin = session.user.role === "ADMIN";
  const isParticipant =
    challenge.challenger.userId === session.user.id ||
    challenge.challenged.userId === session.user.id;

  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ error: "Not authorised to submit this result." }, { status: 403 });
  }

  // Winner must be one of the two participants
  if (winnerId !== challenge.challengerId && winnerId !== challenge.challengedId) {
    return NextResponse.json(
      { error: "Winner must be either the challenger or the challenged player." },
      { status: 400 }
    );
  }

  const challengerWon = winnerId === challenge.challengerId;

  await prisma.$transaction(async (tx) => {
    // Record result
    await tx.ladderChallenge.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        winnerId,
        score: score ?? null,
        notes: notes ?? null,
      },
    });

    if (challengerWon) {
      // Swap ranks
      await swapRanks(
        tx,
        { id: challenge.challenger.id, rank: challenge.challenger.rank! },
        { id: challenge.challenged.id, rank: challenge.challenged.rank! }
      );

      // History for both players
      await addHistory(
        tx,
        challenge.challenger.id,
        challenge.challenger.rank!,
        challenge.challenged.rank!,
        "Won challenge — moved up",
        session.user.id
      );
      await addHistory(
        tx,
        challenge.challenged.id,
        challenge.challenged.rank!,
        challenge.challenger.rank!,
        "Lost challenge — moved down",
        session.user.id
      );
    } else {
      // Challenged player won — no rank changes
      await addHistory(
        tx,
        challenge.challenged.id,
        challenge.challenged.rank!,
        challenge.challenged.rank!,
        "Defended position — rank unchanged",
        session.user.id
      );
      await addHistory(
        tx,
        challenge.challenger.id,
        challenge.challenger.rank!,
        challenge.challenger.rank!,
        "Challenge unsuccessful — rank unchanged",
        session.user.id
      );
    }
  });

  return NextResponse.json({ success: true, challengerWon });
}
