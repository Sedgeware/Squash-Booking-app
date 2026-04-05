import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ladder/challenge/[id]/withdraw
 * Withdraw a PENDING challenge. Only the challenger may withdraw.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;

    const challenge = await prisma.ladderChallenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { userId: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }
    if (challenge.challenger.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the challenger can withdraw this challenge." }, { status: 403 });
    }
    if (challenge.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot withdraw a challenge that is ${challenge.status.toLowerCase()}.` },
        { status: 409 }
      );
    }

    await prisma.ladderChallenge.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[withdraw] unexpected error", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
