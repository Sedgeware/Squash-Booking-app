import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { insertAtRank, getActiveCount, assertValidInsertRank, addHistory } from "@/lib/ladder";

/**
 * POST /api/admin/ladder/approve
 * Approve a PENDING ladder join request and assign a starting rank.
 *
 * Body: { ladderPlayerId: string, startingRank: number, notes?: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json();
  const { ladderPlayerId, startingRank, notes } = body as {
    ladderPlayerId: string;
    startingRank: number;
    notes?: string;
  };

  if (!ladderPlayerId || !startingRank) {
    return NextResponse.json({ error: "ladderPlayerId and startingRank are required." }, { status: 400 });
  }

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { id: ladderPlayerId },
    include: { user: { select: { name: true } } },
  });

  if (!ladderPlayer) {
    return NextResponse.json({ error: "Ladder player not found." }, { status: 404 });
  }
  if (ladderPlayer.status !== "PENDING") {
    return NextResponse.json(
      { error: `Player status is ${ladderPlayer.status}, not PENDING.` },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    const activeCount = await getActiveCount(tx);
    assertValidInsertRank(startingRank, activeCount);

    await insertAtRank(tx, ladderPlayerId, startingRank);

    await tx.ladderPlayer.update({
      where: { id: ladderPlayerId },
      data: {
        approvedAt: new Date(),
        approvedById: session.user.id,
        notes: notes ?? null,
      },
    });

    await addHistory(
      tx,
      ladderPlayerId,
      null,
      startingRank,
      `Approved and placed at rank ${startingRank} by admin`,
      session.user.id
    );
  });

  return NextResponse.json({ success: true });
}
