import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeFromRank, addHistory } from "@/lib/ladder";

/**
 * POST /api/admin/ladder/deactivate
 * Deactivate an ACTIVE player: sets status INACTIVE, clears rank,
 * cancels open challenges, and closes the gap in the ranking.
 *
 * Body: { ladderPlayerId: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json();
  const { ladderPlayerId } = body as { ladderPlayerId: string };

  if (!ladderPlayerId) {
    return NextResponse.json({ error: "ladderPlayerId is required." }, { status: 400 });
  }

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { id: ladderPlayerId },
  });

  if (!ladderPlayer) return NextResponse.json({ error: "Ladder player not found." }, { status: 404 });
  if (ladderPlayer.status !== "ACTIVE") {
    return NextResponse.json({ error: "Player is not currently active." }, { status: 409 });
  }

  const oldRank = ladderPlayer.rank!;

  await prisma.$transaction(async (tx) => {
    await removeFromRank(tx, { id: ladderPlayerId, rank: oldRank }, "INACTIVE");

    await addHistory(
      tx,
      ladderPlayerId,
      oldRank,
      null,
      `Deactivated by admin (was rank ${oldRank})`,
      session.user.id
    );
  });

  return NextResponse.json({ success: true });
}
