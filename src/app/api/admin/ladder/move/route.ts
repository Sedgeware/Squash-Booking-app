import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { movePlayer, getActiveCount, assertValidMoveRank, addHistory } from "@/lib/ladder";

/**
 * POST /api/admin/ladder/move
 * Move an ACTIVE player to a new rank.  Rank sequence is preserved.
 *
 * Body: { ladderPlayerId: string, newRank: number }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json();
  const { ladderPlayerId, newRank } = body as { ladderPlayerId: string; newRank: number };

  if (!ladderPlayerId || newRank == null) {
    return NextResponse.json({ error: "ladderPlayerId and newRank are required." }, { status: 400 });
  }

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { id: ladderPlayerId },
  });

  if (!ladderPlayer) return NextResponse.json({ error: "Ladder player not found." }, { status: 404 });
  if (ladderPlayer.status !== "ACTIVE") {
    return NextResponse.json({ error: "Player is not currently active on the ladder." }, { status: 409 });
  }
  if (ladderPlayer.rank === newRank) {
    return NextResponse.json({ message: "Player is already at that rank." });
  }

  const oldRank = ladderPlayer.rank!;

  await prisma.$transaction(async (tx) => {
    const activeCount = await getActiveCount(tx);
    assertValidMoveRank(newRank, activeCount);

    await movePlayer(tx, { id: ladderPlayerId, rank: oldRank }, newRank);

    await addHistory(
      tx,
      ladderPlayerId,
      oldRank,
      newRank,
      `Manually moved from rank ${oldRank} to rank ${newRank} by admin`,
      session.user.id
    );
  });

  return NextResponse.json({ success: true });
}
