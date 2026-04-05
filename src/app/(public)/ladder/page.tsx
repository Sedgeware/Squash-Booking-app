import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES } from "@/lib/ladder";
import { LadderStandings } from "@/components/ladder/LadderStandings";
import { JoinLadderCard } from "@/components/ladder/JoinLadderCard";
import { cn } from "@/lib/utils";

// ─── Feed helpers ─────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  icon: string;
  iconCls: string;
  text: string;
  timestamp: Date;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LadderPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // ── Current user's ladder record ──────────────────────────────────────────
  let myLadderPlayer: { id: string; status: string; rank: number | null } | null = null;
  if (userId) {
    myLadderPlayer = await prisma.ladderPlayer.findUnique({
      where: { userId },
      select: { id: true, status: true, rank: true },
    });
  }

  const isActiveLadderPlayer = myLadderPlayer?.status === "ACTIVE";

  // ── Standings ──────────────────────────────────────────────────────────────
  const players = await prisma.ladderPlayer.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } } },
    orderBy: { rank: "asc" },
  });

  const playerIds = players.map((p) => p.id);

  // ── All parallel data fetches ─────────────────────────────────────────────
  const [
    openChallenges,
    rankHistory,
    formChallenges,
    recentChallenges,
    recentJoins,
  ] = await Promise.all([
    // Open challenges for eligibility
    isActiveLadderPlayer
      ? prisma.ladderChallenge.findMany({
          where: { status: { in: [...OPEN_STATUSES] } },
          select: { challengerId: true, challengedId: true },
        })
      : ([] as { challengerId: string; challengedId: string }[]),

    // Movement: rank history per player
    playerIds.length > 0
      ? prisma.ladderHistory.findMany({
          where: { ladderPlayerId: { in: playerIds } },
          orderBy: { createdAt: "desc" },
          select: { ladderPlayerId: true, oldRank: true, newRank: true },
        })
      : ([] as { ladderPlayerId: string; oldRank: number | null; newRank: number | null }[]),

    // Form: last completed challenges per player
    playerIds.length > 0
      ? prisma.ladderChallenge.findMany({
          where: {
            status: "COMPLETED",
            OR: [
              { challengerId: { in: playerIds } },
              { challengedId: { in: playerIds } },
            ],
          },
          orderBy: { completedAt: "desc" },
          select: { challengerId: true, challengedId: true, winnerId: true },
          take: Math.max(playerIds.length * 6, 30),
        })
      : ([] as { challengerId: string; challengedId: string; winnerId: string | null }[]),

    // Activity feed: completed + accepted
    prisma.ladderChallenge.findMany({
      where: { status: { in: ["ACCEPTED", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        status: true,
        respondedAt: true,
        completedAt: true,
        challengerId: true,
        challengedId: true,
        winnerId: true,
        score: true,
        challenger: { select: { user: { select: { name: true } } } },
        challenged: { select: { user: { select: { name: true } } } },
      },
    }),

    // Activity feed: recent joins only
    prisma.ladderHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        reason: true,
        newRank: true,
        createdAt: true,
        ladderPlayer: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  // ── Movement map ─────────────────────────────────────────────────────────
  const movementByPlayer: Record<string, number> = {};
  for (const h of rankHistory) {
    if (
      !(h.ladderPlayerId in movementByPlayer) &&
      h.oldRank !== null &&
      h.newRank !== null
    ) {
      movementByPlayer[h.ladderPlayerId] = h.oldRank - h.newRank; // positive = moved up
    }
  }

  // ── Form map ──────────────────────────────────────────────────────────────
  const formByPlayer: Record<string, ("W" | "L")[]> = {};
  for (const ch of formChallenges) {
    for (const pid of [ch.challengerId, ch.challengedId]) {
      if (!formByPlayer[pid]) formByPlayer[pid] = [];
      if (formByPlayer[pid].length < 5) {
        formByPlayer[pid].push(ch.winnerId === pid ? "W" : "L");
      }
    }
  }

  const standings = players.map((p) => ({
    id: p.id,
    userId: p.userId,
    rank: p.rank!,
    name: p.user.name,
    avatarUrl: p.user.avatarUrl,
    phone: isActiveLadderPlayer && p.showPhone ? p.user.phone : null,
    email: isActiveLadderPlayer && p.showEmail ? p.user.email : null,
    movement: movementByPlayer[p.id] ?? 0,
    form: formByPlayer[p.id] ?? ([] as ("W" | "L")[]),
  }));

  const feedItems: FeedItem[] = [];

  for (const ch of recentChallenges) {
    const challengerName = ch.challenger.user.name;
    const challengedName = ch.challenged.user.name;

    if (ch.status === "COMPLETED" && ch.completedAt) {
      const winnerName =
        ch.winnerId === ch.challengerId
          ? challengerName
          : ch.winnerId === ch.challengedId
            ? challengedName
            : null;
      const loserName =
        winnerName === challengerName ? challengedName : challengerName;
      const scoreStr = ch.score ? ` (${ch.score})` : "";

      feedItems.push({
        id: `c-${ch.id}`,
        icon: "★",
        iconCls: "bg-brand-100 text-brand-700",
        text: winnerName
          ? `${winnerName} beat ${loserName}${scoreStr}`
          : `Match: ${challengerName} vs ${challengedName}${scoreStr}`,
        timestamp: ch.completedAt,
      });
    } else if (ch.status === "ACCEPTED" && ch.respondedAt) {
      feedItems.push({
        id: `a-${ch.id}`,
        icon: "✓",
        iconCls: "bg-blue-100 text-blue-600",
        text: `${challengedName} accepted ${challengerName}'s challenge`,
        timestamp: ch.respondedAt,
      });
    }
  }

  // Only join events from history (rank-change events are redundant with completed feed)
  for (const h of recentJoins) {
    const name = h.ladderPlayer.user.name;
    if (
      h.reason.toLowerCase().includes("joined") ||
      h.reason.toLowerCase().includes("approved")
    ) {
      feedItems.push({
        id: `j-${h.id}`,
        icon: "+",
        iconCls: "bg-green-100 text-green-700",
        text: `${name} joined the ladder at rank #${h.newRank}`,
        timestamp: h.createdAt,
      });
    }
  }

  feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const feed = feedItems.slice(0, 6);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mixed Ladder</h1>
        <p className="text-gray-500 mt-1">
          Compete against other members and climb the rankings
        </p>
      </div>

      {/* Status banners */}
      {userId && !myLadderPlayer && <JoinLadderCard />}

      {myLadderPlayer?.status === "PENDING" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-5">
          <p className="font-semibold text-amber-900">Request pending approval</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Your ladder request has been sent to the admin. You&apos;ll be
            placed at a starting rank once approved.
          </p>
        </div>
      )}

      {(myLadderPlayer?.status === "INACTIVE" ||
        myLadderPlayer?.status === "REMOVED") && (
        <div className="rounded-2xl bg-gray-50 border border-gray-200 px-6 py-5 space-y-3">
          <div>
            <p className="font-semibold text-gray-800">
              You are no longer active on the ladder
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Your ladder membership was{" "}
              {myLadderPlayer.status === "INACTIVE" ? "deactivated" : "removed"}.
              You can request to re-join below.
            </p>
          </div>
          <JoinLadderCard compact />
        </div>
      )}

      {/* Active player position banner */}
      {isActiveLadderPlayer && myLadderPlayer && (
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Your position
            </p>
            <p className="text-4xl font-black text-brand-700">
              #{myLadderPlayer.rank}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 border border-brand-200">
            Active
          </span>
        </div>
      )}

      {/* Rules — non-active users only */}
      {!isActiveLadderPlayer && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-3">How the ladder works</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Challenge players ranked up to 3 places above you",
              "If the challenger wins, the two players swap positions",
              "One open outgoing and one open incoming challenge at a time",
              "Contact details are shared between active ladder members to arrange matches",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="text-brand-500 font-bold mt-0.5">✓</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main content — standings + feed side by side on wide screens */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Standings table */}
        <div className="flex-1 min-w-0">
          <LadderStandings
            standings={standings}
            myLadderPlayer={
              isActiveLadderPlayer && myLadderPlayer
                ? { id: myLadderPlayer.id, rank: myLadderPlayer.rank! }
                : null
            }
            openChallenges={openChallenges}
            isLoggedIn={!!userId}
            isActiveLadderPlayer={isActiveLadderPlayer}
          />
        </div>

        {/* Activity feed — sidebar on wide screens */}
        {feed.length > 0 && (
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 text-sm">
                  Recent activity
                </h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {feed.map((item) => (
                  <li key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        item.iconCls
                      )}
                    >
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 leading-snug">
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {timeAgo(item.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
