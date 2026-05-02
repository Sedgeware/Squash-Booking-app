/**
 * Shown by Next.js while the Ladder/Standings server component is streaming.
 * Mirrors the two-column layout (standings table + activity feed sidebar).
 */
export default function LadderLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 bg-gray-200 rounded-lg w-36" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Standings table skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex gap-4">
              <div className="h-3 bg-gray-200 rounded w-8" />
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
            {/* Player rows */}
            <div className="divide-y divide-gray-50">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="px-4 py-4 flex items-center gap-3">
                  <div className="w-5 h-3 bg-gray-100 rounded flex-shrink-0" />
                  <div className="h-9 w-9 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="h-7 w-7 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="h-3.5 bg-gray-200 rounded w-28" />
                      <div className="flex gap-0.5 mt-0.5">
                        {[0, 1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-2 w-2 bg-gray-100 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-20 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed skeleton */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
            <div className="divide-y divide-gray-50">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="h-6 w-6 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
