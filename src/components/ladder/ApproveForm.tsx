"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  ladderPlayerId: string;
  playerName: string;
  activeCount: number;
}

export function ApproveForm({ ladderPlayerId, playerName, activeCount }: Props) {
  const router = useRouter();
  const maxRank = activeCount + 1;
  const [startingRank, setStartingRank] = useState(maxRank);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/ladder/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ladderPlayerId, startingRank, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Approval failed.");
      } else {
        router.push("/admin/ladder");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
    >
      <h2 className="font-semibold text-gray-800">Assign rank</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Starting rank
        </label>
        <input
          type="number"
          min={1}
          max={maxRank}
          value={startingRank}
          onChange={(e) => setStartingRank(Number(e.target.value))}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Enter a rank between 1 and {maxRank}.
          Players at or below this rank will be shifted down by one.
          {activeCount === 0
            ? " This will be the first player on the ladder."
            : ` There are currently ${activeCount} active player${activeCount !== 1 ? "s" : ""}.`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes about this player..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Approving..."
            : `Approve ${playerName} at rank ${startingRank}`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
