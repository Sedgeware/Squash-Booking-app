import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeFromRank, addHistory } from "@/lib/ladder";

/**
 * POST /api/admin/ladder/remove
 * Permanently remove a player from the ladder (status = REMOVED).
 * Works for both ACTIVE and PENDING players.
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

  await prisma.$transaction(async (tx) => {
    if (ladderPlayer.status === "ACTIVE" && ladderPlayer.rank !== null) {
      await removeFromRank(tx, { id: ladderPlayerId, rank: ladderPlayer.rank }, "REMOVED");
    } else {
      // PENDING, INACTIVE, or already REMOVED — just cancel challenges and mark removed
      await tx.ladderChallenge.updateMany({
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          OR: [{ challengerId: ladderPlayerId }, { challengedId: ladderPlayerId }],
        },
        data: { status: "CANCELLED" },
      });
      await tx.ladderPlayer.update({
        where: { id: ladderPlayerId },
        data: { status: "REMOVED", rank: null },
      });
    }

    await addHistory(
      tx,
      ladderPlayerId,
      ladderPlayer.rank,
      null,
      `Removed from ladder by admin`,
      session.user.id
    );
  });

  return NextResponse.json({ success: true });
}
