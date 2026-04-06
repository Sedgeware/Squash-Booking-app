import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendChallengeAcceptedEmail, sendChallengeDeclinedEmail } from "@/lib/email";

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
      challenger: { select: { rank: true, user: { select: { name: true, email: true } } } },
      challenged: { select: { rank: true, userId: true, user: { select: { name: true } } } },
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

  // Notify the original challenger — fire and forget
  if (action === "ACCEPT") {
    sendChallengeAcceptedEmail({
      to: challenge.challenger.user.email,
      challengerName: challenge.challenger.user.name,
      challengedName: challenge.challenged.user.name,
      challengedRank: challenge.challenged.rank,
    }).catch((err) => console.error("[email] challenge-accepted notification failed:", err));
  } else {
    sendChallengeDeclinedEmail({
      to: challenge.challenger.user.email,
      challengerName: challenge.challenger.user.name,
      challengedName: challenge.challenged.user.name,
    }).catch((err) => console.error("[email] challenge-declined notification failed:", err));
  }

  return NextResponse.json({ challenge: updated });
}
