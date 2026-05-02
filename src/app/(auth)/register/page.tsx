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
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-sm text-gray-500 mb-6">Join the Tamworth Squash Ladder today</p>

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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
    </>
  );
}
