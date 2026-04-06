import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting, settingBool } from "@/lib/settings";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch fresh user data from DB so name/avatar reflect recent profile edits
  // without requiring a re-login.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true },
  });

  const bookingsEnabled = settingBool(await getSetting("bookingsEnabled"));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        bookingsEnabled={bookingsEnabled}
        userName={dbUser?.name ?? session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        avatarUrl={dbUser?.avatarUrl ?? null}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-14 md:pt-0 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
