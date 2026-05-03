"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreedToPrivacy) {
      setError("You must agree to the Privacy Policy to create an account.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, agreedToPrivacy }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Logo + context block ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-6 space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/rankd-logo.png"
          alt="Rankd"
          className="h-10 w-auto object-contain bg-transparent mb-4"
          draggable={false}
        />
        <h1 className="text-white text-2xl font-semibold">Create account</h1>
        <p className="text-gray-300 text-sm font-medium">Tamworth Squash Ladder</p>
        <p className="text-gray-500 text-xs">Powered by Rankd</p>
      </div>

      {/* ── Register card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        {/* Privacy Policy agreement */}
        <div className="flex items-start gap-3">
          <input
            id="agreedToPrivacy"
            type="checkbox"
            checked={agreedToPrivacy}
            onChange={(e) => {
              setAgreedToPrivacy(e.target.checked);
              if (e.target.checked) setError("");
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
          />
          <label htmlFor="agreedToPrivacy" className="text-sm text-gray-600 leading-snug">
            I have read and agree to the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#16A34A] active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
      </div>
    </div>
  );
}
