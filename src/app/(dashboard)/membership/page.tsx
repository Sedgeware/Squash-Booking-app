import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting, settingBool } from "@/lib/settings";
import { SubscribeButton } from "./SubscribeButton";

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const membershipsEnabled = settingBool(await getSetting("membershipsEnabled"));

  // Non-admins are blocked when the memberships module is disabled
  if (!membershipsEnabled && !isAdmin) {
    redirect("/dashboard");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const isActive =
    membership?.status === "ACTIVE" &&
    membership.currentPeriodEnd > new Date();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
        <p className="text-gray-500 mt-1">Manage your Tamworth Squash Club membership</p>
      </div>

      {/* Current status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Current status</h2>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
              isActive
                ? "bg-brand-100 text-brand-700 border border-brand-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {isActive ? "Active" : membership ? "Inactive" : "No membership"}
          </span>
        </div>

        {isActive && membership && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Start date</dt>
              <dd className="font-medium text-gray-800">
                {new Date(membership.currentPeriodStart).toLocaleDateString("en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Renewal date</dt>
              <dd className="font-medium text-gray-800">
                {new Date(membership.currentPeriodEnd).toLocaleDateString("en-GB")}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Plan card */}
      {!isActive && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Monthly
          </div>
          <h2 className="text-lg font-bold text-gray-900">Club Membership</h2>
          <p className="text-gray-500 text-sm mt-1 mb-6">
            Unlimited court bookings, subject to availability
          </p>

          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">£25</span>
            <span className="text-gray-400 text-sm"> / month</span>
          </div>

          <ul className="space-y-2 mb-8 text-sm text-gray-600">
            {[
              "Access to Court 1 & Court 2",
              "Book up to 1 hour per day",
              "6am–10pm opening hours",
              "Cancel anytime",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <SubscribeButton />

          <p className="text-xs text-gray-400 mt-4 text-center">
            Demo mode — Stripe integration ready. No real charge will be made.
          </p>
        </div>
      )}

      {isActive && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 text-sm text-gray-500">
          To cancel your membership, please contact the club directly at{" "}
          <span className="font-medium text-gray-700">info@tamworthsquash.com</span>.
        </div>
      )}
    </div>
  );
}
