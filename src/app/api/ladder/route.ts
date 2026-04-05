import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ladder
 * Returns all ACTIVE ladder players ordered by rank.
 * Contact details (phone/email) are only included if the requester is an
 * ACTIVE ladder player themselves, and only if the player's show flags permit.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  // Determine if the caller is an active ladder member
  let isActiveLadderPlayer = false;
  if (session?.user?.id) {
    const myRecord = await prisma.ladderPlayer.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    });
    isActiveLadderPlayer = myRecord?.status === "ACTIVE";
  }

  const players = await prisma.ladderPlayer.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { rank: "asc" },
  });

  const data = players.map((p) => ({
    id: p.id,
    userId: p.userId,
    rank: p.rank,
    name: p.user.name,
    // Only expose contact details to active ladder players, respecting flags
    phone: isActiveLadderPlayer && p.showPhone ? p.user.phone : null,
    email: isActiveLadderPlayer && p.showEmail ? p.user.email : null,
    showPhone: p.showPhone,
    showEmail: p.showEmail,
    status: p.status,
  }));

  return NextResponse.json(data);
}
