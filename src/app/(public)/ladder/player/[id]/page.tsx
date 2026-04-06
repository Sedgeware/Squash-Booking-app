import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { RankChart } from "@/components/ladder/RankChart";
import { Avatar } from "@/components/Avatar";

// ─── Types passed to client components ───────────────────────────────────────

export interface ChartPoint {
  date: string; // ISO string — serialisable across server→client
  rank: number;
}

interface RecentResult {
  id: string;
  opponentName: string;
  outcome: "win" | "loss";
  score: string | null;
  date: string;
}

interface ActivityItem {
  id: string;
  icon: string;
  iconCls: string;
  text: string;
  date: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  // ── Fetch viewer's ladder status (controls contact visibility) ────────────
  const viewerPlayer = viewerId
    ? await prisma.ladderPlayer.findUnique({
        where: { userId: viewerId },
        select: { status: true },
      })
    : null;
  const viewerIsActiveLadder = viewerPlayer?.status === "ACTIVE";
  const viewerIsAdmin = session?.user?.role === "ADMIN";
  const canSeeContact = viewerIsActiveLadder || viewerIsAdmin;

  // ── Fetch the profile player ──────────────────────────────────────────────
  const player = await prisma.ladderPlayer.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
    },
  });

  if (!player || player.status === "REMOVED") notFound();

  const playerAvatarUrl = player.user.avatarUrl;

  // ── Completed challenges (for stats + recent results) ────────────────────
  const completedChallenges = await prisma.ladderChallenge.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ challengerId: id }, { challengedId: id }],
    },
    include: {
      challenger: { select: { id: true, user: { select: { name: true } } } },
      challenged: { select: { id: true, user: { select: { name: true } } } },
    },
    orderBy: { completedAt: "desc" },
  });

  // ── Rank history (for chart + best rank) ─────────────────────────────────
  const history = await prisma.ladderHistory.findMany({
    where: { ladderPlayerId: id },
    orderBy: { createdAt: "asc" },
  });

  // ── Compute stats ─────────────────────────────────────────────────────────
  const played = completedChallenges.length;
  const wins = completedChallenges.filter((c) => c.winnerId === id).length;
  const losses = played - wins;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : null;

  // Current streak — iterate recent results oldest-first until streak breaks
  let streak = 0;
  let streakType: "W" | "L" | null = null;
  for (const c of completedChallenges) {
    // completedChallenges is already desc (newest first)
    const won = c.winnerId === id;
    if (streakType === null) {
      streakType = won ? "W" : "L";
      streak = 1;
    } else if ((won && streakType === "W") || (!won && streakType === "L")) {
      streak++;
    } else {
      break;
    }
  }

  // Best rank from history (lowest rank number = best position)
  const ranksInHistory = history
    .filter((h) => h.newRank !== null)
    .map((h) => h.newRank!);
  if (player.rank !== null) ranksInHistory.push(player.rank);
  const bestRank = ranksInHistory.length > 0 ? Math.min(...ranksInHistory) : null;

  // ── Build chart data from rank history ────────────────────────────────────
  // Each LadderHistory record captures a rank change event.
  // We build a timeline: { date, rank } for every rank-change event.
  const chartPoints: ChartPoint[] = history
    .filter((h) => h.newRank !== null)
    .map((h) => ({
      date: h.createdAt.toISOString(),
      rank: h.newRank!,
    }));

  // Append current rank as "now" so the line reaches today
  if (player.status === "ACTIVE" && player.rank !== null) {
    chartPoints.push({
      date: new Date().toISOString(),
      rank: player.rank,
    });
  }

  // ── Recent results (last 5 completed) ────────────────────────────────────
  const recentResults: RecentResult[] = completedChallenges
    .slice(0, 5)
    .map((c) => {
      const won = c.winnerId === id;
      const opponent =
        c.challengerId === id ? c.challenged.user.name : c.challenger.user.name;
      return {
        id: c.id,
        opponentName: opponent,
        outcome: won ? "win" : "loss",
        score: c.score,
        date: (c.completedAt ?? c.updatedAt).toISOString(),
      };
    });

  // ── Activity feed from history ────────────────────────────────────────────
  const activity: ActivityItem[] = history
    .slice()
    .reverse() // most recent first
    .slice(0, 8)
    .map((h) => {
      const isUp =
        h.oldRank !== null && h.newRank !== null && h.newRank < h.oldRank;
      const isDown =
        h.oldRank !== null && h.newRank !== null && h.newRank > h.oldRank;
      const isJoin = h.reason.toLowerCase().includes("approved") || h.reason.toLowerCase().includes("joined");

      if (isJoin) {
        return {
          id: h.id,
          icon: "+",
          iconCls: "bg-green-100 text-green-700",
          text: `Joined the ladder at rank #${h.newRank}`,
          date: h.createdAt.toISOString(),
        };
      }
      if (isUp) {
        return {
          id: h.id,
          icon: "↑",
          iconCls: "bg-green-100 text-green-600",
          text: `Moved up from #${h.oldRank} to #${h.newRank}`,
          date: h.createdAt.toISOString(),
        };
      }
      if (isDown) {
        return {
          id: h.id,
          icon: "↓",
          iconCls: "bg-red-50 text-red-500",
          text: `Moved down from #${h.oldRank} to #${h.newRank}`,
          date: h.createdAt.toISOString(),
        };
      }
      return {
        id: h.id,
        icon: "·",
        iconCls: "bg-gray-100 text-gray-400",
        text: h.reason,
        date: h.createdAt.toISOString(),
      };
    });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/ladder"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span>←</span> Back to ladder
      </Link>

      {/* ── Hero card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <Avatar
              name={player.user.name}
              avatarUrl={playerAvatarUrl}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {player.user.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={player.status} />
                {player.status === "ACTIVE" && player.rank && (
                  <span className="text-sm text-gray-500">
                    Rank <span className="font-bold text-gray-800">#{player.rank}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rank prominently */}
          {player.status === "ACTIVE" && player.rank && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Current rank
              </p>
              <p className="text-4xl sm:text-5xl font-black text-brand-700 leading-none mt-1">
                #{player.rank}
              </p>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="border-t border-gray-100 px-6 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>
            Joined{" "}
            {player.joinedAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {player.approvedAt && (
            <span>
              Active since{" "}
              {player.approvedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {canSeeContact && player.showPhone && player.user.phone && (
            <span>📞 {player.user.phone}</span>
          )}
          {canSeeContact && player.showEmail && player.user.email && (
            <span>✉ {player.user.email}</span>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Played" value={played} />
        <StatCard
          label="Wins"
          value={wins}
          valueClass={wins > 0 ? "text-brand-600" : undefined}
        />
        <StatCard
          label="Losses"
          value={losses}
          valueClass={losses > 0 ? "text-red-500" : undefined}
        />
        <StatCard
          label="Win rate"
          value={winPct !== null ? `${winPct}%` : "—"}
          valueClass={
            winPct !== null && winPct >= 50 ? "text-brand-600" : undefined
          }
        />
      </div>

      {/* Secondary stats row */}
      {(streak > 0 || bestRank !== null) && (
        <div className="grid grid-cols-2 gap-4">
          {streak > 0 && streakType && (
            <StatCard
              label={`Current streak`}
              value={`${streak} ${streakType === "W" ? "win" : "loss"}${streak !== 1 ? "s" : ""}`}
              valueClass={
                streakType === "W" ? "text-brand-600" : "text-red-500"
              }
            />
          )}
          {bestRank !== null && (
            <StatCard
              label="Best rank"
              value={`#${bestRank}`}
              valueClass={bestRank === 1 ? "text-yellow-600" : "text-gray-800"}
            />
          )}
        </div>
      )}

      {/* ── Rank history chart ── */}
      {chartPoints.length >= 2 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Rank progression</h2>
          <p className="text-xs text-gray-400 mb-4">
            Rank over time — lower is better, #1 is the top
          </p>
          <RankChart data={chartPoints} />
        </div>
      ) : chartPoints.length === 1 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Rank progression</h2>
          <p className="text-xs text-gray-400">
            Not enough rank changes yet to draw a chart.
            Currently at rank #{chartPoints[0].rank}.
          </p>
        </div>
      ) : null}

      {/* ── Recent results ── */}
      {recentResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent results</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last {recentResults.length} completed matches</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {recentResults.map((r) => (
              <li
                key={r.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0",
                      r.outcome === "win"
                        ? "bg-brand-100 text-brand-700 border border-brand-200"
                        : "bg-red-50 text-red-500 border border-red-200"
                    )}
                  >
                    {r.outcome === "win" ? "W" : "L"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {r.outcome === "win" ? "Beat" : "Lost to"}{" "}
                      {r.opponentName}
                    </p>
                    {r.score && (
                      <p className="text-xs text-gray-400">{r.score}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {shortDate(r.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Last 5 indicator strip (W/L) ── */}
      {recentResults.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Last {recentResults.length}:</span>
          <div className="flex gap-1">
            {recentResults.map((r) => (
              <span
                key={r.id}
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                  r.outcome === "win"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-red-50 text-red-500"
                )}
              >
                {r.outcome === "win" ? "W" : "L"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Ladder activity / history ── */}
      {activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Ladder history</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {activity.map((item) => (
              <li
                key={item.id}
                className="px-6 py-3.5 flex items-start gap-3"
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
                    item.iconCls
                  )}
                >
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {shortDate(item.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state — no activity yet */}
      {played === 0 && activity.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 text-center text-sm text-gray-400">
          No match history yet.
        </div>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-black mt-1 text-gray-900", valueClass)}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE: {
      cls: "bg-brand-50 text-brand-700 border-brand-200",
      label: "Active",
    },
    PENDING: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Pending",
    },
    INACTIVE: {
      cls: "bg-gray-50 text-gray-500 border-gray-200",
      label: "Inactive",
    },
  };
  const badge = map[status] ?? map.INACTIVE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        badge.cls
      )}
    >
      {badge.label}
    </span>
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
