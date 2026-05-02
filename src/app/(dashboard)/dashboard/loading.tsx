/**
 * Shown by Next.js while the Dashboard server component is streaming.
 * Mirrors the rough shape of the page without any real data.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-3xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 bg-gray-200 rounded-lg w-52" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>

      {/* Rank hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-32" />
            <div className="h-12 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 bg-gray-200 rounded-xl w-28" />
            <div className="h-9 bg-gray-100 rounded-xl w-32" />
          </div>
        </div>
      </div>

      {/* Around you card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        <div className="divide-y divide-gray-50">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-3.5 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who you can challenge card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-44" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="divide-y divide-gray-50">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 bg-gray-200 rounded w-28" />
                  <div className="h-3 bg-gray-100 rounded w-14" />
                </div>
              </div>
              <div className="h-6 bg-gray-100 rounded-full w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
