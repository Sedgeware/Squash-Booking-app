import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApproveForm } from "@/components/ladder/ApproveForm";

export default async function ApproveLadderPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  if (!ladderPlayer) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Not found</h1>
        <p className="text-gray-500">This ladder player record was not found.</p>
      </div>
    );
  }

  if (ladderPlayer.status !== "PENDING") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Cannot approve</h1>
        <p className="text-gray-500">
          This player is currently <strong>{ladderPlayer.status}</strong>, not
          PENDING.
        </p>
      </div>
    );
  }

  const activeCount = await prisma.ladderPlayer.count({
    where: { status: "ACTIVE" },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approve ladder request</h1>
        <p className="text-gray-500 mt-1">
          Assign a starting rank for this player
        </p>
      </div>

      {/* Player details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Player details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-800">{ladderPlayer.user.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-800">{ladderPlayer.user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-800">
              {ladderPlayer.user.phone ?? "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Requested</dt>
            <dd className="font-medium text-gray-800">
              {new Date(ladderPlayer.joinedAt).toLocaleDateString("en-GB")}
            </dd>
          </div>
        </dl>
      </div>

      <ApproveForm
        ladderPlayerId={ladderPlayer.id}
        playerName={ladderPlayer.user.name}
        activeCount={activeCount}
      />
    </div>
  );
}
