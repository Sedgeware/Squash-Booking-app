"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinLadderCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleJoin() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/ladder/join", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else if (data.message) {
        setSuccess(data.message);
      } else {
        setSuccess("Your request has been submitted. An admin will assign your starting rank.");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div>
        {error && (
          <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-2 text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Re-join ladder"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-200 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Join the ladder</h2>
        <p className="text-sm text-gray-500 mt-1">
          Compete against other members in our mixed ladder. Challenge players
          ranked above you and climb the standings.
        </p>
      </div>
      <p className="text-xs text-gray-400">
        By joining the ladder, you agree to have your contact details (phone
        and email) shared with other active ladder participants for the purpose
        of arranging matches.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Submitting..." : "Join Ladder"}
      </button>
    </div>
  );
}
