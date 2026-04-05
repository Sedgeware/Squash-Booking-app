import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting, settingBool } from "@/lib/settings";
import { BookingGrid } from "@/components/BookingGrid";

export default async function BookingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const bookingsEnabled = settingBool(await getSetting("bookingsEnabled"));

  // Non-admins are blocked when the booking module is disabled
  if (!bookingsEnabled && !isAdmin) {
    redirect("/dashboard");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      currentPeriodEnd: { gte: new Date() },
    },
  });

  const hasActiveMembership = !!membership;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Court</h1>
        <p className="text-gray-500 mt-1">
          Select a date and an available slot on Court 1 or Court 2.
        </p>
      </div>

      <BookingGrid
        currentUserId={session.user.id}
        hasActiveMembership={hasActiveMembership || isAdmin}
        isAdmin={isAdmin}
      />
    </div>
  );
}
