import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSetting, settingBool } from "@/lib/settings";
import { ModuleToggle } from "./ModuleToggle";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const bookingsEnabled = settingBool(await getSetting("bookingsEnabled"));

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage app modules and feature visibility for members.
        </p>
      </div>

      {/* Modules section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Modules
          </h2>
        </div>

        <ModuleToggle
          label="Court Bookings"
          description="Allow members to view and book squash courts. When disabled, the booking module is hidden from members and direct access is blocked. Admins can still access bookings."
          settingKey="bookingsEnabled"
          initialValue={bookingsEnabled}
        />
      </section>
    </div>
  );
}
