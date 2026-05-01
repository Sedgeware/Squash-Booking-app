import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/ladder/my-challenges
 * Returns all challenges where the current user is challenger or challenged.
 * Includes player names and ranks for display.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!ladderPlayer) {
    return NextResponse.json({ outgoing: [], incoming: [] });
  }

  const playerInclude = {
    select: {
      id: true,
      rank: true,
      user: { select: { name: true } },
    },
  } as const;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const historicalFilter: Prisma.LadderChallengeWhereInput = {
    OR: [
      { status: { in: ["PENDING", "ACCEPTED"] } },
      { status: { in: ["DECLINED", "COMPLETED", "CANCELLED"] }, updatedAt: { gte: thirtyDaysAgo } },
    ],
  };

  const [outgoing, incoming] = await Promise.all([
    prisma.ladderChallenge.findMany({
      where: { challengerId: ladderPlayer.id, ...historicalFilter },
      include: { challenger: playerInclude, challenged: playerInclude },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.ladderChallenge.findMany({
      where: { challengedId: ladderPlayer.id, ...historicalFilter },
      include: { challenger: playerInclude, challenged: playerInclude },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    myLadderPlayerId: ladderPlayer.id,
    outgoing,
    incoming,
  });
}
