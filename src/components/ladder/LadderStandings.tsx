"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getChallengeState } from "@/lib/ladder";
import { Avatar } from "@/components/Avatar";

interface StandingRow {
  id: string;
  userId: string;
  rank: number;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  movement: number;
  form: ("W" | "L")[];
}

interface Props {
  standings: StandingRow[];
  myLadderPlayer: { id: string; rank: number } | null;
  openChallenges: { challengerId: string; challengedId: string }[];
  isLoggedIn: boolean;
  isActiveLadderPlayer: boolean;
}

export function LadderStandings({
  standings,
  myLadderPlayer,
  openChallenges,
  isLoggedIn,
  isActiveLadderPlayer,
}: Props) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChallenge(targetId: string) {
    setActionLoading(targetId);
    setError(null);
    try {
      const res = await fetch("/api/ladder/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengedLadderPlayerId: targetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to issue challenge.");
      } else {
        router.refresh();
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
        <p className="text-gray-400 text-sm">No active ladder players yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Standings</h2>
        <span className="text-xs text-gray-400">
          {standings.length} player{standings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 font-semibold underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {/* Movement placeholder — ready for real data in Phase 2 */}
              <th className="w-6 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-14">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Player
              </th>
              {isActiveLadderPlayer && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">
                    Email
                  </th>
                </>
              )}
              {isActiveLadderPlayer && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 w-40">
                  Challenge
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((player, idx) => {
              const isMe = player.id === myLadderPlayer?.id;

              let challengeState: ReturnType<typeof getChallengeState> | null = null;
              if (myLadderPlayer && isActiveLadderPlayer) {
                challengeState = getChallengeState(
                  { id: myLadderPlayer.id, rank: myLadderPlayer.rank, status: "ACTIVE" },
                  { id: player.id, rank: player.rank },
                  openChallenges
                );
              }

              return (
                <tr
                  key={player.id}
                  className={cn(
                    "transition-colors",
                    isMe
                      ? "bg-brand-50 hover:bg-brand-50/80"
                      : "hover:bg-gray-50/80"
                  )}
                >
                  {/* Movement indicator */}
                  <td className="pl-3 pr-1 py-4 w-6 text-center">
                    <MovementBadge movement={player.movement} />
                  </td>

                  {/* Rank badge */}
                  <td className="px-4 py-4">
                    <RankBadge rank={player.rank} isMe={isMe} />
                  </td>

                  {/* Player name + avatar */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={player.name}
                        avatarUrl={player.avatarUrl}
                        size="xs"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/ladder/player/${player.id}`}
                            className={cn(
                              "text-sm font-semibold hover:underline underline-offset-2 transition-colors",
                              isMe
                                ? "text-brand-700 hover:text-brand-800"
                                : "text-gray-800 hover:text-brand-600"
                            )}
                          >
                            {player.name}
                          </Link>
                          {isMe && (
                            <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
                              You
                            </span>
                          )}
                        </div>
                        <FormDots form={player.form} />
                      </div>
                    </div>
                  </td>

                  {/* Contact details (active players only) */}
                  {isActiveLadderPlayer && (
                    <>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {player.phone ?? (
                          <span className="text-gray-300 italic text-xs">hidden</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {player.email ?? (
                          <span className="text-gray-300 italic text-xs">hidden</span>
                        )}
                      </td>
                    </>
                  )}

                  {/* Challenge action */}
                  {isActiveLadderPlayer && (
                    <td className="px-4 py-4 text-right">
                      {isMe ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : challengeState === "challengeable" ? (
                        <button
                          onClick={() => handleChallenge(player.id)}
                          disabled={actionLoading === player.id}
                          className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {actionLoading === player.id ? "…" : "Challenge"}
                        </button>
                      ) : (
                        <ChallengeStatePill state={challengeState!} />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-gray-400 text-center pt-1">
          Sign in and join the ladder to see contact details and issue challenges.
        </p>
      )}
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank, isMe }: { rank: number; isMe: boolean }) {
  if (rank === 1) {
    return (
      <div className="relative inline-flex items-center justify-center w-9 h-9">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-sm" />
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-yellow-50 to-yellow-100 flex items-center justify-center">
          <span className="text-sm font-black text-yellow-700 leading-none">1</span>
        </div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative inline-flex items-center justify-center w-9 h-9">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 shadow-sm" />
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
          <span className="text-sm font-black text-gray-600 leading-none">2</span>
        </div>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative inline-flex items-center justify-center w-9 h-9">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-orange-300 to-orange-500 shadow-sm" />
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
          <span className="text-sm font-black text-orange-700 leading-none">3</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold border",
        isMe
          ? "bg-brand-50 text-brand-700 border-brand-300"
          : "bg-gray-50 text-gray-400 border-gray-200"
      )}
    >
      {rank}
    </div>
  );
}

// ─── Movement badge ───────────────────────────────────────────────────────────

function MovementBadge({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
        <span className="text-[10px]">▲</span>
        {movement}
      </span>
    );
  }
  if (movement < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-400">
        <span className="text-[10px]">▼</span>
        {Math.abs(movement)}
      </span>
    );
  }
  return <span className="text-xs text-gray-300">&mdash;</span>;
}

// ─── Form dots ────────────────────────────────────────────────────────────────

function FormDots({ form }: { form: ("W" | "L")[] }) {
  if (form.length === 0) return null;
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {form.map((result, i) => (
        <span
          key={i}
          title={result === "W" ? "Win" : "Loss"}
          className={cn(
            "inline-block w-2 h-2 rounded-full",
            result === "W" ? "bg-emerald-400" : "bg-red-300"
          )}
        />
      ))}
    </div>
  );
}

// ─── Challenge state pill ─────────────────────────────────────────────────────

function ChallengeStatePill({
  state,
}: {
  state: ReturnType<typeof getChallengeState>;
}) {
  const map: Record<string, { label: string; cls: string }> = {
    "not-above": {
      label: "Below you",
      cls: "bg-gray-50 text-gray-400 border-gray-200",
    },
    "too-far": {
      label: "Too far above",
      cls: "bg-gray-50 text-gray-400 border-gray-200",
    },
    "has-open-outgoing": {
      label: "Challenge pending",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    "target-has-incoming": {
      label: "Already challenged",
      cls: "bg-gray-50 text-gray-500 border-gray-200",
    },
    "already-challenged": {
      label: "Active challenge",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    self: { label: "", cls: "" },
  };

  const pill = map[state];
  if (!pill?.label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
        pill.cls
      )}
    >
      {pill.label}
    </span>
  );
}
