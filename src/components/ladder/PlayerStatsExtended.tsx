"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormResult {
  outcome: "W" | "L";
  opponentName: string;
  score: string | null;
}

export interface H2HMatch {
  challengerId: string;
  challengedId: string;
  winnerId: string | null;
  score: string | null;
  completedAt: string; // ISO
}

export interface H2HPlayer {
  id: string;
  name: string;
  rank: number | null;
}

interface Props {
  /** LadderPlayer.id of the profile being viewed */
  playerId: string;
  /** Last 5 completed matches, newest first. null = placeholder */
  formResults: Array<FormResult | null>;
  rivalName: string | null;
  rivalMatches: number;
  /** ISO string of most recent match vs the rival */
  rivalLastDate: string | null;
  /** ISO string of most recent completed match */
  lastMatchDate: string | null;
  /** ISO string of most recent challenge activity (any status) */
  lastActivityDate: string | null;
  h2hMatches: H2HMatch[];
  h2hPlayers: H2HPlayer[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerStatsExtended({
  playerId,
  formResults,
  rivalName,
  rivalMatches,
  rivalLastDate,
  lastMatchDate,
  lastActivityDate,
  h2hMatches,
  h2hPlayers,
}: Props) {
  const [selectedOpponentId, setSelectedOpponentId] = useState("");

  // ── H2H computation (pure, runs on every render after selection) ─────────
  const selectedOpponent = h2hPlayers.find((p) => p.id === selectedOpponentId) ?? null;

  const h2hStats = (() => {
    if (!selectedOpponentId) return null;

    const relevant = h2hMatches.filter(
      (m) =>
        (m.challengerId === playerId && m.challengedId === selectedOpponentId) ||
        (m.challengerId === selectedOpponentId && m.challengedId === playerId)
    );

    if (relevant.length === 0) {
      return {
        played: 0,
        wins: 0,
        losses: 0,
        winRate: null as number | null,
        lastResult: null as "W" | "L" | null,
        lastScore: null as string | null,
      };
    }

    const wins = relevant.filter((m) => m.winnerId === playerId).length;
    const losses = relevant.length - wins;
    const winRate = Math.round((wins / relevant.length) * 100);

    // Most recent match — sort desc by completedAt
    const sorted = [...relevant].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    const lastResult: "W" | "L" = sorted[0].winnerId === playerId ? "W" : "L";
    const lastScore = sorted[0].score;

    return { played: relevant.length, wins, losses, winRate, lastResult, lastScore };
  })();

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Row 1: Form + Rival ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Form
          </p>
          <div className="flex gap-2">
            {formResults.map((result, i) =>
              result !== null ? (
                <div key={i} className="relative group">
                  {/* Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold cursor-default select-none",
                      result.outcome === "W"
                        ? "bg-brand-600 text-white"
                        : "bg-red-500 text-white"
                    )}
                  >
                    {result.outcome}
                  </span>
                  {/* Tooltip — pure CSS, no JS needed */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-xl whitespace-nowrap">
                      {result.outcome === "W" ? "Beat" : "Lost to"} {result.opponentName}
                      {result.score ? ` (${result.score})` : ""}
                    </div>
                    {/* Caret */}
                    <div className="mx-auto h-2 w-2 -mt-1 rotate-45 bg-gray-900" />
                  </div>
                </div>
              ) : (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium bg-gray-100 text-gray-300 border border-gray-200 select-none"
                >
                  –
                </span>
              )
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Last 5 completed matches</p>
        </div>

        {/* Rival */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Rival
          </p>
          {rivalName ? (
            <>
              <p className="text-sm font-semibold text-gray-800">
                🔥 {rivalName}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {rivalMatches} match{rivalMatches !== 1 ? "es" : ""}
                {rivalLastDate ? ` · Last played ${daysAgo(rivalLastDate)}` : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No rival yet</p>
          )}
        </div>
      </div>

      {/* ── Row 2: Last activity ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Last activity
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Last match</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {lastMatchDate ? daysAgo(lastMatchDate) : "No matches yet"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Last challenge</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {lastActivityDate ? daysAgo(lastActivityDate) : "No activity yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Row 3: Head to head ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Head to head
          </p>
          <select
            value={selectedOpponentId}
            onChange={(e) => setSelectedOpponentId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="">Select a player to compare records</option>
            {h2hPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rank !== null ? `#${p.rank} · ` : ""}{p.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedOpponentId && (
          <p className="text-sm text-gray-400 text-center py-1">
            Choose a player above to see your head-to-head record
          </p>
        )}

        {selectedOpponentId && h2hStats && (
          h2hStats.played === 0 ? (
            <p className="text-sm text-gray-400 text-center py-1">
              No completed matches against this player yet.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Record summary line */}
              <p className="text-sm text-gray-500">
                Record:{" "}
                <span className="font-bold text-gray-900">
                  {h2hStats.wins}–{h2hStats.losses}
                </span>
              </p>

              {/* Stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Played" value={h2hStats.played} />
                <MiniStat
                  label="Wins"
                  value={h2hStats.wins}
                  valueClass={h2hStats.wins > 0 ? "text-brand-600" : undefined}
                />
                <MiniStat
                  label="Losses"
                  value={h2hStats.losses}
                  valueClass={h2hStats.losses > 0 ? "text-red-500" : undefined}
                />
                <MiniStat
                  label="Win rate"
                  value={`${h2hStats.winRate}%`}
                  valueClass={
                    h2hStats.winRate !== null && h2hStats.winRate >= 50
                      ? "text-brand-600"
                      : undefined
                  }
                />
              </div>

              {/* Last result — full description */}
              {h2hStats.lastResult && selectedOpponent && (
                <p className="text-xs text-gray-400">
                  Last result:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      h2hStats.lastResult === "W" ? "text-brand-600" : "text-red-500"
                    )}
                  >
                    {h2hStats.lastResult === "W" ? "Beat" : "Lost to"}{" "}
                    {selectedOpponent.rank !== null ? `#${selectedOpponent.rank} ` : ""}
                    {selectedOpponent.name}
                    {h2hStats.lastScore ? ` (${h2hStats.lastScore})` : ""}
                  </span>
                </p>
              )}
            </div>
          )
        )}
      </div>

    </div>
  );
}

// ─── Mini stat tile ───────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={cn("text-xl font-bold mt-0.5 text-gray-900", valueClass)}>{value}</p>
    </div>
  );
}
