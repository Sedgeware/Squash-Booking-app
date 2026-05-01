import Link from "next/link";

export const metadata = {
  title: "Ladder Rules – Tamworth Squash Ladder",
  description: "How the Tamworth Squash Ladder works — challenges, ranking movement, and fair play.",
};

export default function RulesPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ladder Rules</h1>
        <p className="text-gray-500 mt-1">
          How the Tamworth Squash Ladder works — everything you need to know.
        </p>
      </div>

      {/* What is the ladder */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">What is the ladder?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          The Tamworth Squash Ladder is a ranking system open to all club members. Every active
          player holds a position — rank #1 is the top. You move up the ladder by challenging
          and beating players ranked above you. It&apos;s a great way to play competitive matches
          against people at a similar level and track your progress over time.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          To join, request a spot from the ladder page. An admin will approve your request
          and place you on the ladder. From there, it&apos;s up to you.
        </p>
      </section>

      {/* How to challenge */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">How to challenge another player</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "You may only challenge players ranked above you (a lower rank number means a higher position).",
            "You can challenge up to 3 places above your current rank. For example, if you are ranked #8, you can challenge #7, #6, or #5.",
            "You may only have one open outgoing challenge at a time — wait for it to be resolved before issuing another.",
            "A player who already has an open incoming challenge cannot be challenged again until that match is settled.",
            "Challenges are issued from the Standings page. The challenged player will receive an email notification and must accept or decline.",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">✓</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* Ranking movement */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">How rankings move after a match</h2>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">If the challenger wins:</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            The challenger moves directly into the beaten player&apos;s position. Every player
            who was ranked between them shifts down by one place. Nobody loses more than one
            spot as a result of a single match.
          </p>
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-mono text-gray-700 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Example</p>
            <p>Before: #1 · #2 · #3 · <span className="text-brand-700 font-bold">#4 (challenger)</span></p>
            <p className="text-gray-400 text-xs my-1">Challenger at #4 beats player at #2 →</p>
            <p>After: &nbsp;#1 · <span className="text-brand-700 font-bold">#2 (challenger)</span> · #3 (was #2) · #4 (was #3)</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">If the challenged player wins:</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            No rankings change. The challenged player successfully defends their position
            and everyone stays where they are.
          </p>
        </div>
      </section>

      {/* Match expectations */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Arranging matches and fair play</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "Once a challenge is accepted, both players are responsible for arranging the match promptly. Aim to play within two weeks where possible.",
            "Contact details for active ladder players are visible to other active players on the Standings page — use these to arrange a time.",
            "Matches are best of 5 games to 11 points (PAR scoring), unless both players agree otherwise.",
            "After the match, either player can submit the result through the app. Enter the score if you can — it helps everyone track form.",
            "Be honest with results. The ladder only works if everyone plays fair.",
            "If a player is consistently unavailable or unresponsive, contact the club admin.",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">✓</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/ladder"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          View the standings →
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
