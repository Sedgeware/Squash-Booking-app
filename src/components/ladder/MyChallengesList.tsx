"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChallengePlayer {
  id: string;
  rank: number | null;
  user: { name: string; avatarUrl?: string | null };
}

interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
  winnerId: string | null;
  score: string | null;
  notes: string | null;
  challenger: ChallengePlayer;
  challenged: ChallengePlayer;
}

interface Props {
  myLadderPlayerId: string;
  outgoing: Challenge[];
  incoming: Challenge[];
}

// ─── Status badge config ──────────────────────────────────────────────────────

interface BadgeConfig {
  cls: string;
  label: string;
  /** Short contextual note shown below the badge */
  hint?: (direction: "outgoing" | "incoming") => string | null;
}

const statusBadges: Record<string, BadgeConfig> = {
  PENDING: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Pending",
    hint: (dir) =>
      dir === "outgoing"
        ? "Awaiting their response"
        : "Your response needed",
  },
  ACCEPTED: {
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Accepted",
    hint: () => "Match to be played — submit result when done",
  },
  DECLINED: {
    cls: "bg-gray-50 text-gray-500 border-gray-200",
    label: "Declined",
    hint: () => null,
  },
  COMPLETED: {
    cls: "bg-brand-50 text-brand-700 border-brand-200",
    label: "Completed",
    hint: () => null,
  },
  CANCELLED: {
    cls: "bg-red-50 text-red-400 border-red-200",
    label: "Cancelled",
    hint: () => null,
  },
};

// ─── Main component ───────────────────────────────────────────────────────────

export function MyChallengesList({ myLadderPlayerId, outgoing, incoming }: Props) {
  const hasAny = outgoing.length > 0 || incoming.length > 0;

  if (!hasAny) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center space-y-3">
        <p className="text-gray-500 font-medium">No challenges yet</p>
        <p className="text-sm text-gray-400">
          Head to the ladder standings to challenge a player above you.
        </p>
        <a
          href="/ladder"
          className="inline-block mt-2 text-sm font-semibold text-brand-600 hover:underline"
        >
          View ladder →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Incoming — shown first so action items are prominent */}
      {incoming.length > 0 && (
        <Section
          title="Incoming challenges"
          subtitle="Players who have challenged you"
          count={incoming.length}
          urgent={incoming.some((c) => c.status === "PENDING")}
        >
          {incoming.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              direction="incoming"
              myLadderPlayerId={myLadderPlayerId}
            />
          ))}
        </Section>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <Section
          title="Outgoing challenges"
          subtitle="Challenges you have issued"
          count={outgoing.length}
        >
          {outgoing.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              direction="outgoing"
              myLadderPlayerId={myLadderPlayerId}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  count,
  urgent,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  urgent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            {title}
            {urgent && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                Action needed
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// ─── Challenge card ───────────────────────────────────────────────────────────

function ChallengeCard({
  challenge: c,
  direction,
  myLadderPlayerId,
}: {
  challenge: Challenge;
  direction: "outgoing" | "incoming";
  myLadderPlayerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResultForm, setShowResultForm] = useState(false);

  const opponent = direction === "outgoing" ? c.challenged : c.challenger;
  const badge = statusBadges[c.status] ?? statusBadges.PENDING;
  const hint = badge.hint?.(direction) ?? null;

  // Incoming PENDING needs most attention → add left accent
  const needsAction = direction === "incoming" && c.status === "PENDING";
  const inProgress = c.status === "ACCEPTED";

  async function handleRespond(action: "ACCEPT" | "DECLINE") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ladder/challenge/${c.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Action failed.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ladder/challenge/${c.id}/withdraw`, { method: "POST" });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* ok */ }
      if (!res.ok) setError(data.error ?? "Failed to withdraw.");
      else router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ladder/challenge/${c.id}/clear`, { method: "POST" });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* ok */ }
      if (!res.ok) setError(data.error ?? "Failed to clear.");
      else router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border shadow-sm overflow-hidden",
        needsAction ? "border-amber-200" : inProgress ? "border-blue-100" : "border-gray-100"
      )}
    >
      {/* Accent bar for urgent items */}
      {needsAction && <div className="h-1 bg-amber-400 rounded-t-2xl" />}
      {inProgress && <div className="h-1 bg-blue-400 rounded-t-2xl" />}

      <div className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Opponent avatar */}
            <Avatar
              name={opponent.user.name}
              avatarUrl={opponent.user.avatarUrl}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {direction === "outgoing" ? (
                  <>
                    You challenged{" "}
                    <span className="text-gray-900">{opponent.user.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-900">{opponent.user.name}</span>{" "}
                    challenged you
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {opponent.rank !== null && (
                  <span className="mr-1.5">Rank #{opponent.rank} ·</span>
                )}
                {new Date(c.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Status badge + hint */}
          <div className="text-right flex-shrink-0">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
                badge.cls
              )}
            >
              {badge.label}
            </span>
            {hint && (
              <p className="text-xs text-gray-400 mt-1 max-w-[160px]">{hint}</p>
            )}
          </div>
        </div>

        {/* Completed result */}
        {c.status === "COMPLETED" && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm space-y-0.5">
            <p className="font-semibold text-brand-800">
              Winner:{" "}
              {c.winnerId === myLadderPlayerId ? (
                <span className="text-brand-700">You 🎉</span>
              ) : (
                <span>{opponent.user.name}</span>
              )}
            </p>
            {c.score && (
              <p className="text-brand-700 text-xs">Score: {c.score}</p>
            )}
            {c.notes && (
              <p className="text-gray-500 text-xs">Notes: {c.notes}</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}

        {/* Incoming PENDING → Accept / Decline */}
        {direction === "incoming" && c.status === "PENDING" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleRespond("ACCEPT")}
              disabled={loading}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Accept"}
            </button>
            <button
              onClick={() => handleRespond("DECLINE")}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Decline"}
            </button>
          </div>
        )}

        {/* Outgoing PENDING → Withdraw */}
        {direction === "outgoing" && c.status === "PENDING" && (
          <div className="pt-1">
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Withdraw challenge"}
            </button>
          </div>
        )}

        {/* ACCEPTED → Submit result */}
        {c.status === "ACCEPTED" && !c.winnerId && (
          <div className="pt-1">
            {!showResultForm ? (
              <button
                onClick={() => setShowResultForm(true)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Submit result
              </button>
            ) : (
              <ResultForm
                challengeId={c.id}
                challengerId={c.challengerId}
                challengedId={c.challengedId}
                challengerName={c.challenger.user.name}
                challengedName={c.challenged.user.name}
                onCancel={() => setShowResultForm(false)}
              />
            )}
          </div>
        )}

        {/* CANCELLED → Clear from list */}
        {c.status === "CANCELLED" && (
          <div className="pt-1">
            <button
              onClick={handleClear}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Clear from list"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result form ──────────────────────────────────────────────────────────────

function ResultForm({
  challengeId,
  challengerId,
  challengedId,
  challengerName,
  challengedName,
  onCancel,
}: {
  challengeId: string;
  challengerId: string;
  challengedId: string;
  challengerName: string;
  challengedName: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [winnerId, setWinnerId] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) { setError("Please select a winner."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ladder/challenge/${challengeId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId,
          score: score || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Failed to submit result.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-4"
    >
      <p className="text-sm font-semibold text-gray-700">Report match result</p>

      {/* Winner selection */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Who won?
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          {[
            { id: challengerId, name: challengerName, tag: "challenger" },
            { id: challengedId, name: challengedName, tag: "challenged" },
          ].map(({ id, name, tag }) => (
            <label
              key={id}
              className={cn(
                "flex items-center gap-2.5 flex-1 rounded-xl border px-4 py-3 cursor-pointer text-sm transition-colors",
                winnerId === id
                  ? "bg-brand-50 border-brand-300 text-brand-800"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="winner"
                value={id}
                checked={winnerId === id}
                onChange={() => setWinnerId(id)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium">{name}</span>
              <span className="text-xs text-gray-400 ml-auto">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Score */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Score{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="e.g. 11-7, 11-9, 11-5"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Notes{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about the match"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting…" : "Submit result"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
