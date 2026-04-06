import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES, getChallengeState } from "@/lib/ladder";
import { sendChallengeReceivedEmail } from "@/lib/email";

/**
 * POST /api/ladder/challenge
 * Create a new challenge from the current player to a target player.
 *
 * Body: { challengedLadderPlayerId: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { challengedLadderPlayerId } = body as { challengedLadderPlayerId: string };

  if (!challengedLadderPlayerId) {
    return NextResponse.json({ error: "challengedLadderPlayerId is required." }, { status: 400 });
  }

  // Load challenger's record
  const challenger = await prisma.ladderPlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, rank: true, status: true, user: { select: { name: true } } },
  });

  if (!challenger || challenger.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "You must be an active ladder player to issue a challenge." },
      { status: 403 }
    );
  }

  // Load challenged player
  const challenged = await prisma.ladderPlayer.findUnique({
    where: { id: challengedLadderPlayerId },
    select: { id: true, rank: true, status: true, user: { select: { name: true, email: true } } },
  });

  if (!challenged || challenged.status !== "ACTIVE") {
    return NextResponse.json({ error: "Target player is not active on the ladder." }, { status: 404 });
  }

  // Fetch all open challenges (for eligibility check)
  const openChallenges = await prisma.ladderChallenge.findMany({
    where: { status: { in: [...OPEN_STATUSES] } },
    select: { challengerId: true, challengedId: true },
  });

  const state = getChallengeState(
    { id: challenger.id, rank: challenger.rank!, status: challenger.status },
    { id: challenged.id, rank: challenged.rank! },
    openChallenges
  );

  const errorMessages: Record<string, string> = {
    self: "You cannot challenge yourself.",
    "not-above": "You can only challenge players ranked above you.",
    "too-far": "You can only challenge up to 3 places above your current rank.",
    "has-open-outgoing": "You already have an open outgoing challenge. Wait for it to conclude before issuing another.",
    "target-has-incoming": "This player already has an open incoming challenge.",
    "already-challenged": "There is already an open challenge between you and this player.",
  };

  if (state !== "challengeable") {
    return NextResponse.json(
      { error: errorMessages[state] ?? "Not eligible to challenge this player." },
      { status: 409 }
    );
  }

  const challenge = await prisma.ladderChallenge.create({
    data: {
      challengerId: challenger.id,
      challengedId: challenged.id,
      status: "PENDING",
    },
  });

  // Notify the challenged player — fire and forget, never block the response
  sendChallengeReceivedEmail({
    to: challenged.user.email,
    challengedName: challenged.user.name,
    challengerName: challenger.user.name,
    challengerRank: challenger.rank,
  }).catch((err) => console.error("[email] challenge-received notification failed:", err));

  return NextResponse.json({ challenge }, { status: 201 });
}
