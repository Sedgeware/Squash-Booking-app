"use client";

import { useState } from "react";
import Link from "next/link";

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">

      {/* ── Logo + context block ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-8 animate-fade-in-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/rankd-logo.png"
          alt="Rankd"
          className="h-14 md:h-16 w-auto object-contain bg-transparent mb-8"
          draggable={false}
        />
        <div className="space-y-2">
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Set new password
          </h1>
          <p className="text-gray-300 text-sm font-medium">
            Tamworth Squash Ladder
          </p>
          <p className="text-gray-500 text-xs">Powered by Rankd</p>
        </div>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        {/* No token provided */}
        {!token ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              This reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block text-sm font-semibold text-[#22C55E] hover:text-[#16A34A] transition-colors"
            >
              Request new link
            </Link>
          </div>
        ) : success ? (
          /* ── Success state ─────────────────────────────────────────────── */
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800">Password updated!</p>
            <p className="text-sm text-gray-500">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="mt-2 inline-block rounded-lg bg-[#22C55E] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#16A34A] hover:shadow-md active:scale-95 transition-all duration-150"
            >
              Sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ────────────────────────────────────────────────── */
          <>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password of at least 8 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-shadow"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#16A34A] hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              >
                {loading ? "Updating…" : "Reset password"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link
                href="/login"
                className="font-semibold text-[#22C55E] hover:text-[#16A34A] transition-colors"
              >
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
