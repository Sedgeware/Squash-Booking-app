/**
 * Public layout — shows the sidebar but does NOT redirect unauthenticated users.
 * Used for the /ladder page which is viewable by anyone.
 */
import { Sidebar } from "@/components/Sidebar";
import { getSetting, settingBool } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const bookingsEnabled = settingBool(await getSetting("bookingsEnabled"));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar bookingsEnabled={bookingsEnabled} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
