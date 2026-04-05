import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/ladder/reject
 * Reject a PENDING join request.  Sets status to REMOVED so re-requests are
 * possible via the standard join flow.
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
  if (ladderPlayer.status !== "PENDING") {
    return NextResponse.json(
      { error: `Player is not PENDING (current: ${ladderPlayer.status}).` },
      { status: 409 }
    );
  }

  await prisma.ladderPlayer.update({
    where: { id: ladderPlayerId },
    data: { status: "REMOVED" },
  });

  return NextResponse.json({ success: true });
}
