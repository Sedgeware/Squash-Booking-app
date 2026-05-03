"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  registered: boolean;
  verified: boolean;
  invalidToken: boolean;
}

export function LoginForm({ registered, verified, invalidToken }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendStatus("idle");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error === "EmailNotVerified") {
      setError("Please verify your email address before signing in. Check your inbox for the verification link.");
      setShowResend(true);
    } else if (result?.error || !result?.ok) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleResend() {
    setResendStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendStatus(res.ok ? "sent" : "error");
    } catch {
      setResendStatus("error");
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 rounded-lg bg-brand-50 border border-brand-200 px-3 py-2.5 text-sm text-brand-800">
          Account created! Check your email and click the verification link before signing in.
        </div>
      )}
      {verified && (
        <div className="mb-4 rounded-lg bg-brand-50 border border-brand-200 px-3 py-2.5 text-sm text-brand-800">
          Email verified! You can now sign in.
        </div>
      )}
      {invalidToken && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          That verification link is invalid or has already been used.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-shadow"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-gray-400 hover:text-[#22C55E] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E] transition-shadow"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            {showResend && (
              resendStatus === "sent" ? (
                <p className="text-sm text-brand-700 font-medium">Verification email sent — check your inbox.</p>
              ) : resendStatus === "error" ? (
                <p className="text-sm text-red-600">Failed to resend. Please try again.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === "sending"}
                  className="text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-50"
                >
                  {resendStatus === "sending" ? "Sending…" : "Resend verification email"}
                </button>
              )
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#16A34A] hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </>
  );
}
