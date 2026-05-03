"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

const mainLinks = [
  { href: "/dashboard",   label: "Dashboard",    icon: HomeIcon },
  { href: "/booking",     label: "Book a Court", icon: CalendarIcon },
];

const adminLinks = [
  { href: "/admin/bookings",  label: "All Bookings", icon: ClipboardIcon },
  { href: "/admin/users",     label: "Users",        icon: UsersIcon },
  { href: "/admin/ladder",    label: "Ladder Admin", icon: ShieldIcon },
  { href: "/admin/settings",  label: "Settings",     icon: SettingsIcon },
];

interface SidebarProps {
  bookingsEnabled?: boolean;
  membershipsEnabled?: boolean;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function RankdLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/rankd-logo.png"
      alt="Rankd"
      className={className}
      draggable={false}
    />
  );
}

// ─── Shared nav content (used in both desktop sidebar and mobile drawer) ───────

function SidebarContent({
  isLoggedIn,
  isAdmin,
  showBookings,
  showMemberships,
  pathname,
  displayName,
  displayEmail,
  avatarUrl,
  onNav,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  showBookings: boolean;
  showMemberships: boolean;
  pathname: string;
  displayName: string;
  displayEmail: string;
  avatarUrl?: string | null;
  onNav?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isLoggedIn && mainLinks.map(({ href, label, icon: Icon }) => {
          if (href === "/booking" && !showBookings) return null;
          if (href === "/membership" && !showMemberships) return null;
          return (
            <NavLink key={href} href={href} label={label}
              icon={<Icon className="h-5 w-5 flex-shrink-0" />}
              active={pathname === href} onClick={onNav}
            />
          );
        })}

        <div className={cn("pt-4 pb-1 px-3", !isLoggedIn && "pt-2")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ladder</p>
        </div>

        <NavLink href="/ladder" label="Standings"
          icon={<TrophyIcon className="h-5 w-5 flex-shrink-0" />}
          active={pathname === "/ladder"} onClick={onNav}
        />

        <NavLink href="/rules" label="Rules"
          icon={<BookOpenIcon className="h-5 w-5 flex-shrink-0" />}
          active={pathname === "/rules"} onClick={onNav}
        />

        {isLoggedIn && (
          <NavLink href="/ladder/my-challenges" label="My Challenges"
            icon={<SwordsIcon className="h-5 w-5 flex-shrink-0" />}
            active={pathname === "/ladder/my-challenges"} onClick={onNav}
          />
        )}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</p>
            </div>
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label}
                icon={<Icon className="h-5 w-5 flex-shrink-0" />}
                active={pathname === href} onClick={onNav}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── User area ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-4 py-4 flex-shrink-0">
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2 mb-2 transition-colors group",
                pathname === "/profile" ? "bg-white/10" : "hover:bg-white/10"
              )}
            >
              <Avatar name={displayName} avatarUrl={avatarUrl} size="sm" className="border-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate leading-tight">{displayName}</p>
                <p className="text-xs text-gray-400 truncate leading-tight">{displayEmail}</p>
              </div>
              <PencilIcon className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300 flex-shrink-0 transition-colors" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogoutIcon className="h-4 w-4" />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={onNav}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Sign in
          </Link>
        )}

        <div className="mt-3 text-center">
          <Link
            href="/privacy"
            onClick={onNav}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function Sidebar({ bookingsEnabled = true, membershipsEnabled = true, userName, userEmail, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer automatically on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isLoggedIn = status === "authenticated" && !!session;
  const isAdmin = session?.user?.role === "ADMIN";
  const displayName = userName || session?.user?.name || "";
  const displayEmail = userEmail || session?.user?.email || "";
  const showBookings = bookingsEnabled || isAdmin;
  const showMemberships = membershipsEnabled || isAdmin;

  const sharedContentProps = {
    isLoggedIn, isAdmin, showBookings, showMemberships, pathname,
    displayName, displayEmail, avatarUrl,
  };

  return (
    <>
      {/* ── Desktop sidebar (md and up) ───────────────────────────────────── */}
      <aside className="hidden md:flex h-full w-64 flex-col shrink-0" style={{ backgroundColor: "#0B1220" }}>
        {/* Logo header */}
        <div className="flex items-center px-5 py-5 border-b border-white/10 mb-2 flex-shrink-0">
          <RankdLogo className="h-8 w-auto" />
        </div>
        <SidebarContent {...sharedContentProps} />
      </aside>

      {/* ── Mobile top bar (below md) ─────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 border-b border-white/10"
        style={{ backgroundColor: "#0B1220" }}
      >
        <RankdLogo className="h-7 w-auto" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <MenuIcon />
        </button>
      </div>

      {/* ── Mobile drawer + backdrop ──────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className="md:hidden fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col text-white shadow-2xl"
            style={{ backgroundColor: "#0B1220" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <RankdLogo className="h-7 w-auto" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <SidebarContent {...sharedContentProps} onNav={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href, label, icon, active, onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
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
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
