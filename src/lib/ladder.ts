/**
 * Ladder rank management service.
 *
 * Every public function accepts a Prisma transaction client (TxClient) so all
 * rank mutations are atomic.  Callers must wrap calls in prisma.$transaction().
 *
 * Rank invariant: ACTIVE players always occupy a continuous sequence 1…N with
 * no gaps and no duplicates.  Every function in this module preserves that.
 */

import { PrismaClient } from "@prisma/client";

// Derive the transaction client type from PrismaClient
type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

// ─── Constants ──────────────────────────────────────────────────────────────

export const OPEN_STATUSES = ["PENDING", "ACCEPTED"] as const;

// ─── Core rank operations ────────────────────────────────────────────────────

/**
 * Insert a player at a specific rank.
 * Shifts all ACTIVE players whose rank >= targetRank down by 1, then sets the
 * player's rank to targetRank and status to ACTIVE.
 *
 * @param targetRank  1-based rank where the player should land.
 */
export async function insertAtRank(
  tx: TxClient,
  playerId: string,
  targetRank: number
): Promise<void> {
  // Shift existing players down
  await tx.ladderPlayer.updateMany({
    where: {
      status: "ACTIVE",
      rank: { gte: targetRank },
      id: { not: playerId },
    },
    data: { rank: { increment: 1 } },
  });

  // Place the player
  await tx.ladderPlayer.update({
    where: { id: playerId },
    data: { rank: targetRank, status: "ACTIVE" },
  });
}

/**
 * Remove a player from the ladder (deactivate or remove).
 * Captures their current rank, clears it, then shifts all ACTIVE players below
 * them up by 1.
 *
 * @param newStatus  "INACTIVE" or "REMOVED"
 */
export async function removeFromRank(
  tx: TxClient,
  player: { id: string; rank: number },
  newStatus: "INACTIVE" | "REMOVED" = "INACTIVE"
): Promise<void> {
  const { id, rank } = player;

  // Clear this player's rank first
  await tx.ladderPlayer.update({
    where: { id },
    data: { rank: null, status: newStatus },
  });

  // Close any open challenges involving this player
  await tx.ladderChallenge.updateMany({
    where: {
      status: { in: ["PENDING", "ACCEPTED"] },
      OR: [{ challengerId: id }, { challengedId: id }],
    },
    data: { status: "CANCELLED" },
  });

  // Shift players below the vacated rank up
  await tx.ladderPlayer.updateMany({
    where: { status: "ACTIVE", rank: { gt: rank } },
    data: { rank: { decrement: 1 } },
  });
}

/**
 * Move a player to a new rank, shifting intermediate players to fill the gap.
 *
 * Moving up   (newRank < oldRank): players in [newRank, oldRank-1] shift down.
 * Moving down (newRank > oldRank): players in [oldRank+1, newRank] shift up.
 */
export async function movePlayer(
  tx: TxClient,
  player: { id: string; rank: number },
  newRank: number
): Promise<void> {
  const { id } = player;
  const oldRank = player.rank;

  if (newRank === oldRank) return;

  if (newRank < oldRank) {
    // Moving up — push intermediate players down
    await tx.ladderPlayer.updateMany({
      where: {
        status: "ACTIVE",
        rank: { gte: newRank, lt: oldRank },
        id: { not: id },
      },
      data: { rank: { increment: 1 } },
    });
  } else {
    // Moving down — pull intermediate players up
    await tx.ladderPlayer.updateMany({
      where: {
        status: "ACTIVE",
        rank: { gt: oldRank, lte: newRank },
        id: { not: id },
      },
      data: { rank: { decrement: 1 } },
    });
  }

  await tx.ladderPlayer.update({
    where: { id },
    data: { rank: newRank },
  });
}

/**
 * Slide the challenger up into the challenged player's position.
 *
 * Every player ranked between the two (inclusive of the challenged player's
 * rank, exclusive of the challenger's rank) is shifted down by 1.
 * The challenger then takes the challenged player's old rank.
 *
 * Example: challenger=4 beats challenged=2
 *   Before: 1, 2, 3, 4(challenger)
 *   Step 1: ranks 2 and 3 each +1  →  1, 3, 4, 4(challenger)
 *   Step 2: challenger → 2         →  1, 2(challenger), 3, 4
 */
export async function slideRanks(
  tx: TxClient,
  challenger: { id: string; rank: number },
  challenged: { id: string; rank: number }
): Promise<void> {
  const targetRank = challenged.rank;  // rank the challenger will occupy
  const fromRank   = challenger.rank;  // rank the challenger is leaving

  // Shift every player in the band [targetRank, fromRank) down by 1
  await tx.ladderPlayer.updateMany({
    where: {
      status: "ACTIVE",
      rank: { gte: targetRank, lt: fromRank },
      id: { not: challenger.id },
    },
    data: { rank: { increment: 1 } },
  });

  // Place the challenger into the vacated top rank
  await tx.ladderPlayer.update({
    where: { id: challenger.id },
    data: { rank: targetRank },
  });
}

// ─── Audit history ───────────────────────────────────────────────────────────

export async function addHistory(
  tx: TxClient,
  ladderPlayerId: string,
  oldRank: number | null,
  newRank: number | null,
  reason: string,
  createdById?: string
): Promise<void> {
  await tx.ladderHistory.create({
    data: { ladderPlayerId, oldRank, newRank, reason, createdById },
  });
}

// ─── Validation helpers ──────────────────────────────────────────────────────

/** Returns the count of ACTIVE ladder players. */
export async function getActiveCount(tx: TxClient): Promise<number> {
  return tx.ladderPlayer.count({ where: { status: "ACTIVE" } });
}

/**
 * Asserts that a proposed rank is within [1, activeCount + 1].
 * Use before inserting a new player.
 */
export function assertValidInsertRank(rank: number, activeCount: number): void {
  if (!Number.isInteger(rank) || rank < 1 || rank > activeCount + 1) {
    throw new RangeError(
      `Starting rank must be between 1 and ${activeCount + 1}. Got ${rank}.`
    );
  }
}

/**
 * Asserts that a proposed move-to rank is within [1, activeCount].
 */
export function assertValidMoveRank(rank: number, activeCount: number): void {
  if (!Number.isInteger(rank) || rank < 1 || rank > activeCount) {
    throw new RangeError(
      `Target rank must be between 1 and ${activeCount}. Got ${rank}.`
    );
  }
}

// ─── Challenge eligibility ───────────────────────────────────────────────────

export type ChallengeState =
  | "challengeable"
  | "self"
  | "not-above"          // target is same rank or below challenger
  | "too-far"            // target is more than 3 places above
  | "has-open-outgoing"  // challenger already has an open outgoing challenge
  | "target-has-incoming"// target already has an open incoming challenge
  | "already-challenged" // open challenge exists between these two
  | "away";              // target has marked themselves as away/unavailable

interface OpenChallenge {
  challengerId: string;
  challengedId: string;
}

/**
 * Compute the challenge state for a specific (challenger, target) pair.
 *
 * @param myPlayer        The challenging player's record.
 * @param targetPlayer    The target player's record. Pass `availability` when known.
 * @param openChallenges  All open (PENDING | ACCEPTED) challenges on the ladder.
 */
export function getChallengeState(
  myPlayer: { id: string; rank: number; status: string } | null,
  targetPlayer: { id: string; rank: number; availability?: string },
  openChallenges: OpenChallenge[]
): ChallengeState {
  if (!myPlayer || myPlayer.status !== "ACTIVE") return "not-above";
  if (myPlayer.id === targetPlayer.id) return "self";

  // Target must be above (lower rank number = better position)
  const diff = myPlayer.rank - targetPlayer.rank;
  if (diff <= 0) return "not-above";
  if (diff > 3) return "too-far";

  // Target has marked themselves unavailable — checked after range so the
  // "away" state only surfaces for players you'd otherwise be eligible to challenge
  if (targetPlayer.availability === "AWAY") return "away";

  // Open challenge between these two (either direction)
  const hasExisting = openChallenges.some(
    (c) =>
      (c.challengerId === myPlayer.id && c.challengedId === targetPlayer.id) ||
      (c.challengerId === targetPlayer.id && c.challengedId === myPlayer.id)
  );
  if (hasExisting) return "already-challenged";

  // Challenger already has an open outgoing challenge
  const hasOutgoing = openChallenges.some((c) => c.challengerId === myPlayer.id);
  if (hasOutgoing) return "has-open-outgoing";

  // Target already has an open incoming challenge
  const targetHasIncoming = openChallenges.some(
    (c) => c.challengedId === targetPlayer.id
  );
  if (targetHasIncoming) return "target-has-incoming";

  return "challengeable";
}
