import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Always read fresh from DB so edits are reflected immediately without re-login.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, avatarUrl: true },
  });

  if (!user) redirect("/login");

  const ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: { userId: session.user.id },
    select: { showPhone: true, showEmail: true, status: true },
  });

  // Only expose ladder prefs if the user is on the ladder (not REMOVED)
  const ladderPrefs =
    ladderPlayer && ladderPlayer.status !== "REMOVED"
      ? { showPhone: ladderPlayer.showPhone, showEmail: ladderPlayer.showEmail }
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your account details and ladder visibility settings.
        </p>
      </div>

      <ProfileForm user={user} ladderPrefs={ladderPrefs} />
    </div>
  );
}
