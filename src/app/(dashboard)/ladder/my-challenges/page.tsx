import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyChallengesList } from "@/components/ladder/MyChallengesList";

export default async function MyChallengesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  });

  if (!ladderPlayer) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Challenges</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 text-center">
          <p className="text-gray-500">You are not on the ladder yet.</p>
          <a
            href="/ladder"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            View the ladder
          </a>
        </div>
      </div>
    );
  }

  const playerInclude = {
    select: {
      id: true,
      rank: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  } as const;

  const ACTIVE_STATUSES = ["PENDING", "ACCEPTED"];
  const HISTORICAL_STATUSES = ["DECLINED", "COMPLETED", "CANCELLED"];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const historicalFilter = {
    OR: [
      { status: { in: ACTIVE_STATUSES } },
      { status: { in: HISTORICAL_STATUSES }, updatedAt: { gte: thirtyDaysAgo } },
    ],
  } as const;

  const [outgoing, incoming] = await Promise.all([
    prisma.ladderChallenge.findMany({
      where: { challengerId: ladderPlayer.id, hiddenByChallenger: false, ...historicalFilter },
      include: { challenger: playerInclude, challenged: playerInclude },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.ladderChallenge.findMany({
      where: { challengedId: ladderPlayer.id, hiddenByChallenged: false, ...historicalFilter },
      include: { challenger: playerInclude, challenged: playerInclude },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Challenges</h1>
        <p className="text-gray-500 mt-1">Track and manage your ladder challenges</p>
      </div>

      <MyChallengesList
        myLadderPlayerId={ladderPlayer.id}
        outgoing={JSON.parse(JSON.stringify(outgoing))}
        incoming={JSON.parse(JSON.stringify(incoming))}
      />
    </div>
  );
}
