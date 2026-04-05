import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ladder/challenge/[id]/respond
 * Accept or decline an incoming challenge.
 *
 * Body: { action: "ACCEPT" | "DECLINE" }
 * Only the challenged player may respond to a PENDING challenge.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: "ACCEPT" | "DECLINE" };

  if (action !== "ACCEPT" && action !== "DECLINE") {
    return NextResponse.json({ error: "action must be ACCEPT or DECLINE." }, { status: 400 });
  }

  const challenge = await prisma.ladderChallenge.findUnique({
    where: { id },
    include: {
      challenged: { select: { userId: true } },
    },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }
  if (challenge.status !== "PENDING") {
    return NextResponse.json(
      { error: `Challenge is already ${challenge.status.toLowerCase()}.` },
      { status: 409 }
    );
  }
  if (challenge.challenged.userId !== session.user.id) {
    return NextResponse.json({ error: "Only the challenged player can respond." }, { status: 403 });
  }

  const updated = await prisma.ladderChallenge.update({
    where: { id },
    data: {
      status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({ challenge: updated });
}
