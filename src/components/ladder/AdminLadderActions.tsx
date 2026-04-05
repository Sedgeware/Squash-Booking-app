"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ActionType = "reject" | "deactivate" | "remove" | "move";

interface Props {
  playerId: string;
  action: ActionType;
  label: string;
  currentRank?: number;
  totalActive?: number;
}

const actionEndpoints: Record<ActionType, string> = {
  reject: "/api/admin/ladder/reject",
  deactivate: "/api/admin/ladder/deactivate",
  remove: "/api/admin/ladder/remove",
  move: "/api/admin/ladder/move",
};

const confirmMessages: Record<ActionType, string> = {
  reject: "Reject this join request?",
  deactivate:
    "Deactivate this player? Their rank will be removed and open challenges cancelled.",
  remove:
    "Remove this player from the ladder? Their rank will be removed and open challenges cancelled.",
  move: "",
};

const buttonStyles: Record<ActionType, string> = {
  reject:
    "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
  deactivate:
    "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
  remove: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
  move: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
};

export function AdminLadderActions({
  playerId,
  action,
  label,
  currentRank,
  totalActive,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMoveInput, setShowMoveInput] = useState(false);
  const [newRank, setNewRank] = useState(currentRank ?? 1);
  const [error, setError] = useState<string | null>(null);

  async function execute(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(actionEndpoints[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
      } else {
        router.refresh();
        setShowMoveInput(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (action === "move") {
      setShowMoveInput((s) => !s);
      return;
    }

    if (!confirm(confirmMessages[action])) return;
    execute({ ladderPlayerId: playerId });
  }

  function handleMove(e: React.FormEvent) {
    e.preventDefault();
    if (newRank === currentRank) {
      setShowMoveInput(false);
      return;
    }
    execute({ ladderPlayerId: playerId, newRank });
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
          buttonStyles[action]
        )}
      >
        {loading ? "..." : label}
      </button>

      {action === "move" && showMoveInput && (
        <form onSubmit={handleMove} className="flex items-center gap-1 mt-1">
          <input
            type="number"
            min={1}
            max={totalActive ?? 99}
            value={newRank}
            onChange={(e) => setNewRank(Number(e.target.value))}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Go
          </button>
          <button
            type="button"
            onClick={() => setShowMoveInput(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </form>
      )}

      {error && (
        <span className="text-xs text-red-600 max-w-[180px]">{error}</span>
      )}
    </div>
  );
}
