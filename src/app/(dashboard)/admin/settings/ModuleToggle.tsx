"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  description: string;
  settingKey: string;
  initialValue: boolean;
}

export function ModuleToggle({ label, description, settingKey, initialValue }: Props) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    setError(null);
    const next = !enabled;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: next }),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) {
        setError(data.error ?? "Failed to update setting.");
      } else {
        setEnabled(next);
        router.refresh(); // re-render server components with new setting
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-5 flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>

      <button
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={loading}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50",
          enabled ? "bg-brand-600" : "bg-gray-200"
        )}
      >
        <span className="sr-only">{enabled ? "Disable" : "Enable"} {label}</span>
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
