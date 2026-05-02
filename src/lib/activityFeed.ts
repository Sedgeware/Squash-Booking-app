/**
 * Shared recent-activity feed helper.
 *
 * Both the Dashboard and the Standings page import from here so they always
 * display the same events in the same order with the same wording.
 *
 * Event types included:
 *   - Completed matches  (winner name + score where available)
 *   - Accepted challenges
 *   - Cancelled challenges
 *   - Players joining the ladder
 *   - Rank movements
 *
 * Results are sorted newest-first and sliced to `limit`.
 */

import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityFeedItem {
  id: string;
  /** Single character / emoji shown in the icon badge. */
  icon: string;
  /** Tailwind classes for the icon badge background + text colour. */
  iconCls: string;
  /** Human-readable description of the event. */
  text: string;
  timestamp: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function timeAgo(date: Date): string {
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

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Fetch, assemble, and return the unified recent activity feed.
 * Safe to call from any server component — runs two parallel Prisma queries.
 */
export async function fetchRecentActivity(
  limit = 8
): Promise<ActivityFeedItem[]> {
  const [challenges, history] = await Promise.all([
    prisma.ladderChallenge.findMany({
      where: { status: { in: ["ACCEPTED", "COMPLETED", "CANCELLED"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        status: true,
        respondedAt: true,
        completedAt: true,
        updatedAt: true,
        winnerId: true,
        score: true,
        challengerId: true,
        challengedId: true,
        challenger: { select: { user: { select: { name: true } } } },
        challenged: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.ladderHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        reason: true,
        oldRank: true,
        newRank: true,
        createdAt: true,
        ladderPlayer: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const items: ActivityFeedItem[] = [];

  // ── Challenge events ────────────────────────────────────────────────────────
  for (const ch of challenges) {
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

      items.push({
        id: `c-${ch.id}`,
        icon: "★",
        iconCls: "bg-brand-100 text-brand-700",
        text: winnerName
          ? `${winnerName} beat ${loserName}${scoreStr}`
          : `Match: ${challengerName} vs ${challengedName}${scoreStr}`,
        timestamp: ch.completedAt,
      });
    } else if (ch.status === "ACCEPTED" && ch.respondedAt) {
      items.push({
        id: `a-${ch.id}`,
        icon: "✓",
        iconCls: "bg-blue-100 text-blue-600",
        text: `${challengedName} accepted ${challengerName}'s challenge`,
        timestamp: ch.respondedAt,
      });
    } else if (ch.status === "CANCELLED") {
      items.push({
        id: `x-${ch.id}`,
        icon: "○",
        iconCls: "bg-red-50 text-red-400",
        text: `Challenge cancelled between ${challengerName} and ${challengedName}`,
        timestamp: ch.updatedAt,
      });
    }
  }

  // ── History events (joins + rank movements) ─────────────────────────────────
  for (const h of history) {
    const name = h.ladderPlayer.user.name;
    const reason = h.reason.toLowerCase();

    if (reason.includes("joined") || reason.includes("approved")) {
      items.push({
        id: `j-${h.id}`,
        icon: "+",
        iconCls: "bg-green-100 text-green-700",
        text: `${name} joined the ladder at rank #${h.newRank}`,
        timestamp: h.createdAt,
      });
    } else if (h.oldRank !== null && h.newRank !== null && h.oldRank !== h.newRank) {
      const movedUp = h.newRank < h.oldRank;
      items.push({
        id: `r-${h.id}`,
        icon: movedUp ? "↑" : "↓",
        iconCls: movedUp ? "bg-purple-100 text-purple-700" : "bg-orange-50 text-orange-500",
        text: movedUp
          ? `${name} moved up from #${h.oldRank} to #${h.newRank}`
          : `${name} moved down from #${h.oldRank} to #${h.newRank}`,
        timestamp: h.createdAt,
      });
    }
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, limit);
}
