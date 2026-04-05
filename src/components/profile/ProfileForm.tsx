"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

interface Props {
  user: {
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  ladderPrefs: {
    showPhone: boolean;
    showEmail: boolean;
  } | null;
}

// ─── Inline feedback component ────────────────────────────────────────────────

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm border",
        type === "success"
          ? "bg-brand-50 border-brand-200 text-brand-800"
          : "bg-red-50 border-red-200 text-red-700"
      )}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-100 transition-opacity font-bold flex-shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 flex-shrink-0 mt-0.5",
          checked ? "bg-brand-500" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ProfileForm({ user, ladderPrefs }: Props) {
  const router = useRouter();

  // ── Personal info state ───────────────────────────────────────────────────
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoToast, setInfoToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Avatar state ──────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarToast, setAvatarToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Ladder prefs state ────────────────────────────────────────────────────
  const [showPhone, setShowPhone] = useState(ladderPrefs?.showPhone ?? true);
  const [showEmail, setShowEmail] = useState(ladderPrefs?.showEmail ?? true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsToast, setPrefsToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  async function savePersonalInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoSaving(true);
    setInfoToast(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInfoToast({ type: "error", message: data.error ?? "Failed to save." });
      } else {
        setInfoToast({ type: "success", message: "Profile updated successfully." });
        router.refresh();
      }
    } catch {
      setInfoToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setInfoSaving(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setAvatarToast(null);
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setAvatarSaving(true);
    setAvatarToast(null);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setAvatarToast({ type: "error", message: data.error ?? "Upload failed." });
      } else {
        setAvatarUrl(data.avatarUrl);
        setAvatarPreview(null);
        setAvatarFile(null);
        setAvatarToast({ type: "success", message: "Photo updated." });
        router.refresh();
      }
    } catch {
      setAvatarToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setAvatarSaving(false);
    }
  }

  function cancelAvatarPreview() {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeAvatar() {
    setAvatarSaving(true);
    setAvatarToast(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setAvatarToast({ type: "error", message: data.error ?? "Failed to remove." });
      } else {
        setAvatarUrl(null);
        setAvatarPreview(null);
        setAvatarFile(null);
        setAvatarToast({ type: "success", message: "Photo removed." });
        router.refresh();
      }
    } catch {
      setAvatarToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setAvatarSaving(false);
    }
  }

  async function saveLadderPrefs() {
    setPrefsSaving(true);
    setPrefsToast(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showPhone, showEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrefsToast({ type: "error", message: data.error ?? "Failed to save." });
      } else {
        setPrefsToast({ type: "success", message: "Visibility preferences saved." });
        router.refresh();
      }
    } catch {
      setPrefsToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setPrefsSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Profile photo ── */}
      <Section
        title="Profile photo"
        description="Shown on the ladder standings and your player profile page."
      >
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            <Avatar
              name={name}
              avatarUrl={displayAvatar}
              size="xl"
            />
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {displayAvatar ? "Change your photo" : "Upload a photo"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPEG, PNG or WebP · Max 2 MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />

            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Choose file
              </label>

              {avatarFile && (
                <>
                  <button
                    onClick={saveAvatar}
                    disabled={avatarSaving}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {avatarSaving ? "Uploading…" : "Save photo"}
                  </button>
                  <button
                    onClick={cancelAvatarPreview}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {avatarUrl && !avatarFile && (
                <button
                  onClick={removeAvatar}
                  disabled={avatarSaving}
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {avatarSaving ? "Removing…" : "Remove photo"}
                </button>
              )}
            </div>

            {avatarFile && (
              <p className="text-xs text-gray-400 truncate max-w-xs">
                Selected: {avatarFile.name}
              </p>
            )}
          </div>
        </div>

        {avatarToast && (
          <div className="mt-4">
            <Toast
              type={avatarToast.type}
              message={avatarToast.message}
              onDismiss={() => setAvatarToast(null)}
            />
          </div>
        )}
      </Section>

      {/* ── Personal details ── */}
      <Section
        title="Personal details"
        description="Your name is shown publicly on the ladder. Phone is only visible to active ladder players who you allow."
      >
        <form onSubmit={savePersonalInfo} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-gray-600 mb-1.5"
            >
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Your full name"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Email address
            </label>
            <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 select-all">
              {user.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed here. Contact an admin if needed.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="profile-phone"
              className="block text-xs font-semibold text-gray-600 mb-1.5"
            >
              Phone number{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 07700 900123"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used for arranging ladder matches. Visibility controlled below.
            </p>
          </div>

          {infoToast && (
            <Toast
              type={infoToast.type}
              message={infoToast.message}
              onDismiss={() => setInfoToast(null)}
            />
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={infoSaving}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {infoSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Ladder visibility prefs (only if user is on ladder) ── */}
      {ladderPrefs !== null && (
        <Section
          title="Ladder contact visibility"
          description="Control which details other active ladder players can see when viewing the standings."
        >
          <div className="divide-y divide-gray-50">
            <Toggle
              id="show-phone"
              label="Show phone number"
              description="Active ladder players can see your phone number on the standings."
              checked={showPhone}
              onChange={setShowPhone}
            />
            <Toggle
              id="show-email"
              label="Show email address"
              description="Active ladder players can see your email address on the standings."
              checked={showEmail}
              onChange={setShowEmail}
            />
          </div>

          {prefsToast && (
            <div className="mt-4">
              <Toast
                type={prefsToast.type}
                message={prefsToast.message}
                onDismiss={() => setPrefsToast(null)}
              />
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={saveLadderPrefs}
              disabled={prefsSaving}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {prefsSaving ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}
