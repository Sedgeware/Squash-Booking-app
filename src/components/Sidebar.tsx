"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

const mainLinks = [
  { href: "/dashboard",   label: "Dashboard",    icon: HomeIcon },
  { href: "/booking",     label: "Book a Court", icon: CalendarIcon },
  { href: "/membership",  label: "Membership",   icon: CreditCardIcon },
];

const ladderLinks = [
  { href: "/ladder",              label: "Standings",     icon: TrophyIcon },
  { href: "/ladder/my-challenges", label: "My Challenges", icon: SwordsIcon },
];

const adminLinks = [
  { href: "/admin/bookings",  label: "All Bookings", icon: ClipboardIcon },
  { href: "/admin/users",     label: "Users",        icon: UsersIcon },
  { href: "/admin/ladder",    label: "Ladder Admin", icon: ShieldIcon },
  { href: "/admin/settings",  label: "Settings",     icon: SettingsIcon },
];

interface SidebarProps {
  bookingsEnabled?: boolean;
  /** Fresh from DB — reflects edits immediately without re-login */
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
}

export function Sidebar({
  bookingsEnabled = true,
  userName,
  userEmail,
  avatarUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && !!session;
  const isAdmin = session?.user?.role === "ADMIN";

  // Prefer DB-fresh values passed from the server layout; fall back to session
  const displayName = userName || session?.user?.name || "";
  const displayEmail = userEmail || session?.user?.email || "";

  // "Book a Court" is hidden for non-admins when bookings are disabled
  const showBookings = bookingsEnabled || isAdmin;

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Tamworth</p>
          <p className="text-xs text-gray-400 leading-tight">Squash Club</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main links — only for logged-in users */}
        {isLoggedIn && mainLinks.map(({ href, label, icon: Icon }) => {
          if (href === "/booking" && !showBookings) return null;
          return (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={<Icon className="h-5 w-5 flex-shrink-0" />}
              active={pathname === href}
            />
          );
        })}

        {/* Ladder section — visible to all */}
        <div className={cn("pt-4 pb-1 px-3", !isLoggedIn && "pt-2")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Ladder
          </p>
        </div>

        {/* Standings always visible */}
        <NavLink
          href="/ladder"
          label="Standings"
          icon={<TrophyIcon className="h-5 w-5 flex-shrink-0" />}
          active={pathname === "/ladder"}
        />

        {/* My Challenges — logged-in only */}
        {isLoggedIn && (
          <NavLink
            href="/ladder/my-challenges"
            label="My Challenges"
            icon={<SwordsIcon className="h-5 w-5 flex-shrink-0" />}
            active={pathname === "/ladder/my-challenges"}
          />
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</p>
            </div>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={<Icon className="h-5 w-5 flex-shrink-0" />}
                active={pathname === href}
              />
            ))}
          </>
        )}
      </nav>

      {/* User area */}
      <div className="border-t border-gray-700 px-4 py-4">
        {isLoggedIn ? (
          <>
            {/* Profile link */}
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2 mb-2 transition-colors group",
                pathname === "/profile"
                  ? "bg-gray-800"
                  : "hover:bg-gray-800"
              )}
            >
              <Avatar
                name={displayName}
                avatarUrl={avatarUrl}
                size="sm"
                className="border-gray-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight">
                  {displayEmail}
                </p>
              </div>
              <PencilIcon className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300 flex-shrink-0 transition-colors" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogoutIcon className="h-4 w-4" />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-700 text-white"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M7 3H4a1 1 0 00-1 1v4c0 3.314 2.686 6 6 6h.5M17 3h3a1 1 0 011 1v4c0 3.314-2.686 6-6 6h-.5M12 3v10" />
    </svg>
  );
}
function SwordsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 14.5L9 9m0 0L4 4m5 5l-1 5-4 1 1-4 5-1zm10-10l-5 5m0 0l5 5m-5-5h.01" />
    </svg>
  );
}
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}
