import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ladder/join
 * Opt-in to the ladder.  Creates a PENDING request (or re-pends if INACTIVE/REMOVED).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const userId = session.user.id;

  const existing = await prisma.ladderPlayer.findUnique({ where: { userId } });

  if (existing) {
    if (existing.status === "PENDING") {
      return NextResponse.json(
        { message: "Your request is already pending admin approval." },
        { status: 200 }
      );
    }
    if (existing.status === "ACTIVE") {
      return NextResponse.json(
        { message: "You are already an active ladder player." },
        { status: 200 }
      );
    }
    // INACTIVE or REMOVED: allow re-request
    const updated = await prisma.ladderPlayer.update({
      where: { userId },
      data: {
        status: "PENDING",
        rank: null,
        approvedAt: null,
        approvedById: null,
        joinedAt: new Date(),
      },
    });
    return NextResponse.json({ ladderPlayer: updated }, { status: 200 });
  }

  // No existing record — create fresh PENDING request
  const ladderPlayer = await prisma.ladderPlayer.create({
    data: { userId, status: "PENDING" },
  });

  return NextResponse.json({ ladderPlayer }, { status: 201 });
}
