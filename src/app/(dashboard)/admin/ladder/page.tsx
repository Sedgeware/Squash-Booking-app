import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLadderActions } from "@/components/ladder/AdminLadderActions";

export default async function AdminLadderPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [pending, active, inactive] = await Promise.all([
    prisma.ladderPlayer.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.ladderPlayer.findMany({
      where: { status: "ACTIVE" },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { rank: "asc" },
    }),
    prisma.ladderPlayer.findMany({
      where: { status: { in: ["INACTIVE", "REMOVED"] } },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ladder Admin</h1>
        <p className="text-gray-500 mt-1">
          Manage join requests, rankings, and player status
        </p>
      </div>

      {/* ─── Pending requests ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">
          Pending join requests
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 text-center text-sm text-gray-400">
            No pending requests.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Phone", "Requested", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map((lp) => (
                  <tr
                    key={lp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                      {lp.user.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {lp.user.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {lp.user.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(lp.joinedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3.5 space-x-2">
                      <Link
                        href={`/admin/ladder/approve/${lp.id}`}
                        className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                      >
                        Approve
                      </Link>
                      <AdminLadderActions
                        playerId={lp.id}
                        action="reject"
                        label="Reject"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Active ladder ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">
          Active ladder
          <span className="ml-2 text-sm font-normal text-gray-400">
            {active.length} player{active.length !== 1 && "s"}
          </span>
        </h2>

        {active.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 text-center text-sm text-gray-400">
            No active ladder players.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Rank",
                    "Name",
                    "Phone",
                    "Email",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {active.map((lp) => (
                  <tr
                    key={lp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-sm font-bold border border-brand-200">
                        {lp.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                      {lp.user.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {lp.user.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {lp.user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AdminLadderActions
                          playerId={lp.id}
                          action="move"
                          label="Move"
                          currentRank={lp.rank!}
                          totalActive={active.length}
                        />
                        <AdminLadderActions
                          playerId={lp.id}
                          action="deactivate"
                          label="Deactivate"
                        />
                        <AdminLadderActions
                          playerId={lp.id}
                          action="remove"
                          label="Remove"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Inactive / Removed ────────────────────────────────────────── */}
      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-800">
            Inactive / Removed
            <span className="ml-2 text-sm font-normal text-gray-400">
              {inactive.length}
            </span>
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Status", "Updated"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inactive.map((lp) => (
                  <tr
                    key={lp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                      {lp.user.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {lp.user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          lp.status === "INACTIVE"
                            ? "bg-gray-50 text-gray-600 border-gray-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {lp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(lp.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
