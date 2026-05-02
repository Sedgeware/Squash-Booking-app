import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChallengeState, OPEN_STATUSES } from "@/lib/ladder";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveChallenge {
  id: string;
  status: string;
  challengerId: string;
  challengedId: string;
  challenger: { user: { name: string }; rank: number | null };
  challenged: { user: { name: string }; rank: number | null };
}

interface FeedEvent {
  id: string;
  type:
    | "challenge_issued"
    | "challenge_accepted"
    | "challenge_declined"
    | "challenge_completed"
    | "challenge_cancelled"
    | "rank_change"
    | "player_joined";
  timestamp: Date;
  actorName: string;
  targetName?: string;
  detail?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  // ── Ladder player record ──────────────────────────────────────────────────
  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { userId },
    select: { id: true, status: true, rank: true },
  });

  const isActiveLadder = ladderPlayer?.status === "ACTIVE";

  // ── Active challenge (PENDING or ACCEPTED involving this user) ────────────
  let activeChallenge: ActiveChallenge | null = null;

  // ── Challengeable players (1-3 ranks above, filtered by eligibility) ──────
  let challengeablePlayers: {
    id: string;
    rank: number;
    name: string;
    avatarUrl: string | null;
    state: ReturnType<typeof getChallengeState>;
  }[] = [];

  // ── Immediate neighbours on the ladder ───────────────────────────────────
  let playerAbove: { id: string; rank: number; user: { name: string; avatarUrl: string | null } } | null = null;
  let playerBelow: { id: string; rank: number; user: { name: string; avatarUrl: string | null } } | null = null;

  if (isActiveLadder && ladderPlayer) {
    const [activeChallengeRaw, openChallenges, abovePlayers, neighbours] =
      await Promise.all([
        prisma.ladderChallenge.findFirst({
          where: {
            status: { in: [...OPEN_STATUSES] },
            OR: [
              { challengerId: ladderPlayer.id },
              { challengedId: ladderPlayer.id },
            ],
          },
          include: {
            challenger: {
              select: { rank: true, user: { select: { name: true } } },
            },
            challenged: {
              select: { rank: true, user: { select: { name: true } } },
            },
          },
        }),
        prisma.ladderChallenge.findMany({
          where: { status: { in: [...OPEN_STATUSES] } },
          select: { challengerId: true, challengedId: true },
        }),
        prisma.ladderPlayer.findMany({
          where: {
            status: "ACTIVE",
            rank: { gte: ladderPlayer.rank! - 3, lt: ladderPlayer.rank! },
          },
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { rank: "asc" },
        }),
        prisma.ladderPlayer.findMany({
          where: {
            status: "ACTIVE",
            rank: { in: [ladderPlayer.rank! - 1, ladderPlayer.rank! + 1] },
          },
          select: { id: true, rank: true, user: { select: { name: true, avatarUrl: true } } },
        }),
      ]);

    activeChallenge = activeChallengeRaw as ActiveChallenge | null;

    challengeablePlayers = abovePlayers.map((p) => ({
      id: p.id,
      rank: p.rank!,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
      state: getChallengeState(
        { id: ladderPlayer.id, rank: ladderPlayer.rank!, status: "ACTIVE" },
        { id: p.id, rank: p.rank! },
        openChallenges
      ),
    }));

    playerAbove = neighbours.find((p) => p.rank === ladderPlayer.rank! - 1) ?? null;
    playerBelow = neighbours.find((p) => p.rank === ladderPlayer.rank! + 1) ?? null;
  }

  // ── Admin summary ─────────────────────────────────────────────────────────
  let adminSummary: {
    pendingCount: number;
    activeCount: number;
    recentChallengeCount: number;
  } | null = null;

  if (isAdmin) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [pendingCount, activeCount, recentChallengeCount] = await Promise.all(
      [
        prisma.ladderPlayer.count({ where: { status: "PENDING" } }),
        prisma.ladderPlayer.count({ where: { status: "ACTIVE" } }),
        prisma.ladderChallenge.count({
          where: { createdAt: { gte: weekAgo } },
        }),
      ]
    );
    adminSummary = { pendingCount, activeCount, recentChallengeCount };
  }

  // ── Activity feed ─────────────────────────────────────────────────────────
  const [recentChallenges, recentHistory] = await Promise.all([
    prisma.ladderChallenge.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        challenger: { select: { user: { select: { name: true } } } },
        challenged: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.ladderHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { ladderPlayer: { select: { user: { select: { name: true } } } } },
    }),
  ]);

  // Build unified feed
  const feedEvents: FeedEvent[] = [];

  for (const ch of recentChallenges) {
    const actorName = ch.challenger.user.name;
    const targetName = ch.challenged.user.name;

    if (ch.status === "ACCEPTED" && ch.respondedAt) {
      feedEvents.push({
        id: `ch-acc-${ch.id}`,
        type: "challenge_accepted",
        timestamp: ch.respondedAt,
        actorName: targetName,
        targetName: actorName,
      });
    }
    if (ch.status === "DECLINED" && ch.respondedAt) {
      feedEvents.push({
        id: `ch-dec-${ch.id}`,
        type: "challenge_declined",
        timestamp: ch.respondedAt,
        actorName: targetName,
        targetName: actorName,
      });
    }
    if (ch.status === "COMPLETED" && ch.completedAt) {
      feedEvents.push({
        id: `ch-cmp-${ch.id}`,
        type: "challenge_completed",
        timestamp: ch.completedAt,
        actorName,
        targetName,
      });
    }
    if (ch.status === "CANCELLED") {
      feedEvents.push({
        id: `ch-can-${ch.id}`,
        type: "challenge_cancelled",
        timestamp: ch.updatedAt,
        actorName,
        targetName,
      });
    }
  }

  for (const h of recentHistory) {
    const name = h.ladderPlayer.user.name;
    if (h.reason.toLowerCase().includes("joined") || h.reason.toLowerCase().includes("approved")) {
      feedEvents.push({
        id: `h-join-${h.id}`,
        type: "player_joined",
        timestamp: h.createdAt,
        actorName: name,
        detail: `Joined at rank #${h.newRank}`,
      });
    } else if (h.oldRank !== h.newRank && h.oldRank !== null && h.newRank !== null) {
      feedEvents.push({
        id: `h-rank-${h.id}`,
        type: "rank_change",
        timestamp: h.createdAt,
        actorName: name,
        detail:
          h.newRank < h.oldRank
            ? `Moved up from #${h.oldRank} to #${h.newRank}`
            : `Moved down from #${h.oldRank} to #${h.newRank}`,
      });
    }
  }

  feedEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const feed = feedEvents.slice(0, 8);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          {isActiveLadder
            ? `You are ranked #${ladderPlayer!.rank} on the ladder`
            : "Tamworth Squash Club"}
        </p>
      </div>

      {/* ── Admin summary bar ── */}
      {isAdmin && adminSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminStatCard
            label="Pending approvals"
            value={adminSummary.pendingCount}
            href="/admin/ladder"
            urgent={adminSummary.pendingCount > 0}
          />
          <AdminStatCard
            label="Active players"
            value={adminSummary.activeCount}
            href="/ladder"
          />
          <AdminStatCard
            label="Challenges this week"
            value={adminSummary.recentChallengeCount}
            href="/admin/ladder"
          />
        </div>
      )}

      {/* ── Active ladder user ── */}
      {isActiveLadder && ladderPlayer && (
        <>
          {/* Rank hero */}
          <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Your ladder position
                </p>
                <p className="text-5xl font-black text-brand-700">
                  #{ladderPlayer.rank}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/ladder"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  View ladder
                </Link>
                <Link
                  href="/ladder/my-challenges"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  My challenges
                </Link>
              </div>
            </div>

            {/* Active challenge banner */}
            {activeChallenge && (
              <div
                className={cn(
                  "border-t px-6 py-3 flex items-center justify-between",
                  activeChallenge.status === "ACCEPTED"
                    ? "bg-blue-50 border-blue-100"
                    : "bg-amber-50 border-amber-100"
                )}
              >
                <ActiveChallengeSummary
                  challenge={activeChallenge}
                  myLadderPlayerId={ladderPlayer.id}
                />
                <Link
                  href="/ladder/my-challenges"
                  className={cn(
                    "text-xs font-semibold underline",
                    activeChallenge.status === "ACCEPTED"
                      ? "text-blue-600"
                      : "text-amber-700"
                  )}
                >
                  Manage →
                </Link>
              </div>
            )}
          </div>

          {/* Around you */}
          {(playerAbove || playerBelow) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Around you</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your immediate neighbours on the ladder
                </p>
              </div>
              <ul className="divide-y divide-gray-50">
                {playerAbove && (
                  <li className="px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={playerAbove.user.name}
                        avatarUrl={playerAbove.user.avatarUrl}
                        size="sm"
                      />
                      <div>
                        <Link
                          href={`/ladder/player/${playerAbove.id}`}
                          className="text-sm font-medium text-gray-800 hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
                        >
                          {playerAbove.user.name}
                        </Link>
                        <p className="text-xs text-gray-400">Rank #{playerAbove.rank}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 italic">above you</span>
                  </li>
                )}

                {/* Current user row */}
                <li className="px-6 py-3.5 flex items-center justify-between bg-brand-50/60">
                  <div className="flex items-center gap-3">
                    <Avatar name={session.user.name ?? ""} avatarUrl={null} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-brand-700">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-brand-500">
                        Rank #{ladderPlayer!.rank} · You
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
                    You
                  </span>
                </li>

                {playerBelow && (
                  <li className="px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={playerBelow.user.name}
                        avatarUrl={playerBelow.user.avatarUrl}
                        size="sm"
                      />
                      <div>
                        <Link
                          href={`/ladder/player/${playerBelow.id}`}
                          className="text-sm font-medium text-gray-800 hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
                        >
                          {playerBelow.user.name}
                        </Link>
                        <p className="text-xs text-gray-400">Rank #{playerBelow.rank}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 italic">below you</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Challengeable players */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Who you can challenge</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Players ranked up to 3 places above you
                </p>
              </div>
              <Link
                href="/ladder"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Full ladder →
              </Link>
            </div>

            {challengeablePlayers.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                You are ranked #1 — no one to challenge above you.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {challengeablePlayers.map((p) => (
                  <li
                    key={p.id}
                    className="px-6 py-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                      <div>
                        <Link
                          href={`/ladder/player/${p.id}`}
                          className="text-sm font-medium text-gray-800 hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-400">Rank #{p.rank}</p>
                      </div>
                    </div>
                    <ChallengeabilityPill state={p.state} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ── Non-active user (no record / pending / inactive / removed) ── */}
      {!isActiveLadder && (
        <div className="space-y-5">
          {/* Ladder intro hero */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600">
                <TrophyIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Mixed Ladder
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Challenge other members, climb the rankings, and compete for
                  the top spot at Tamworth Squash Club.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              {[
                "Challenge players up to 3 ranks above you",
                "Win a challenge to swap positions",
                "One active challenge at a time",
                "Contact details shared between active players",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-brand-500 font-bold mt-0.5">✓</span>
                  {rule}
                </li>
              ))}
            </ul>

            {/* Status-specific CTAs */}
            {!ladderPlayer && (
              <div className="pt-2">
                <Link
                  href="/ladder"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Join the ladder →
                </Link>
              </div>
            )}

            {ladderPlayer?.status === "PENDING" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm font-semibold text-amber-900">
                  Request pending approval
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You&apos;ll be placed at a starting rank once an admin
                  approves your request.
                </p>
              </div>
            )}

            {(ladderPlayer?.status === "INACTIVE" ||
              ladderPlayer?.status === "REMOVED") && (
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/ladder"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Re-join ladder →
                </Link>
                <span className="text-xs text-gray-400">
                  Your account was previously{" "}
                  {ladderPlayer.status === "INACTIVE"
                    ? "deactivated"
                    : "removed"}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/ladder"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
          >
            View current standings →
          </Link>
        </div>
      )}

      {/* ── Activity feed ── */}
      {feed.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent ladder activity</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {feed.map((event) => (
              <li key={event.id} className="px-6 py-3.5 flex items-start gap-3">
                <FeedIcon type={event.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <FeedEventText event={event} />
                  </p>
                  {event.detail && (
                    <p className="text-xs text-gray-400 mt-0.5">{event.detail}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {timeAgo(event.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActiveChallengeSummary({
  challenge,
  myLadderPlayerId,
}: {
  challenge: ActiveChallenge;
  myLadderPlayerId: string;
}) {
  const iAmChallenger = challenge.challengerId === myLadderPlayerId;
  const opponentName = iAmChallenger
    ? challenge.challenged.user.name
    : challenge.challenger.user.name;

  if (challenge.status === "ACCEPTED") {
    return (
      <p className="text-sm text-blue-800">
        <span className="font-semibold">Match to play:</span> vs {opponentName} — submit your result when done
      </p>
    );
  }
  if (iAmChallenger) {
    return (
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Awaiting response</span> from {opponentName}
      </p>
    );
  }
  return (
    <p className="text-sm text-amber-800">
      <span className="font-semibold">{opponentName} has challenged you</span> — accept or decline
    </p>
  );
}

function ChallengeabilityPill({
  state,
}: {
  state: ReturnType<typeof getChallengeState>;
}) {
  if (state === "challengeable") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-200">
        Challenge available
      </span>
    );
  }
  if (state === "has-open-outgoing") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
        You have an open challenge
      </span>
    );
  }
  if (state === "already-challenged") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
        Active challenge
      </span>
    );
  }
  if (state === "target-has-incoming") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
        Has pending challenge
      </span>
    );
  }
  return null;
}

function AdminStatCard({
  label,
  value,
  href,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow",
        urgent && value > 0 ? "border-amber-200" : "border-gray-100"
      )}
    >
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={cn(
          "text-3xl font-black mt-1",
          urgent && value > 0 ? "text-amber-600" : "text-gray-900"
        )}
      >
        {value}
      </p>
    </Link>
  );
}

function FeedIcon({ type }: { type: FeedEvent["type"] }) {
  const base = "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold";
  switch (type) {
    case "challenge_issued":
      return <span className={cn(base, "bg-amber-100 text-amber-700")}>⚔</span>;
    case "challenge_accepted":
      return <span className={cn(base, "bg-blue-100 text-blue-700")}>✓</span>;
    case "challenge_declined":
      return <span className={cn(base, "bg-gray-100 text-gray-500")}>✗</span>;
    case "challenge_completed":
      return <span className={cn(base, "bg-brand-100 text-brand-700")}>★</span>;
    case "challenge_cancelled":
      return <span className={cn(base, "bg-red-50 text-red-400")}>○</span>;
    case "rank_change":
      return <span className={cn(base, "bg-purple-100 text-purple-700")}>↕</span>;
    case "player_joined":
      return <span className={cn(base, "bg-green-100 text-green-700")}>+</span>;
  }
}

function FeedEventText({ event }: { event: FeedEvent }) {
  switch (event.type) {
    case "challenge_issued":
      return (
        <>
          <span className="font-semibold">{event.actorName}</span> challenged{" "}
          <span className="font-semibold">{event.targetName}</span>
        </>
      );
    case "challenge_accepted":
      return (
        <>
          <span className="font-semibold">{event.actorName}</span> accepted a challenge from{" "}
          <span className="font-semibold">{event.targetName}</span>
        </>
      );
    case "challenge_declined":
      return (
        <>
          <span className="font-semibold">{event.actorName}</span> declined a challenge from{" "}
          <span className="font-semibold">{event.targetName}</span>
        </>
      );
    case "challenge_completed":
      return (
        <>
          Match completed:{" "}
          <span className="font-semibold">{event.actorName}</span> vs{" "}
          <span className="font-semibold">{event.targetName}</span>
        </>
      );
    case "challenge_cancelled":
      return (
        <>
          Challenge cancelled between{" "}
          <span className="font-semibold">{event.actorName}</span> and{" "}
          <span className="font-semibold">{event.targetName}</span>
        </>
      );
    case "rank_change":
      return <span className="font-semibold">{event.actorName}</span>;
    case "player_joined":
      return (
        <>
          <span className="font-semibold">{event.actorName}</span> joined the ladder
        </>
      );
  }
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M7 3H4a1 1 0 00-1 1v4c0 3.314 2.686 6 6 6h.5M17 3h3a1 1 0 011 1v4c0 3.314-2.686 6-6 6h-.5M12 3v10" />
    </svg>
  );
}
