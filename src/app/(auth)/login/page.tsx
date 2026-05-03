import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ registered?: string; verified?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
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
            Welcome back
          </h1>
          <p className="text-gray-300 text-sm font-medium">
            Tamworth Squash Ladder
          </p>
          <p className="text-gray-500 text-xs">Powered by Rankd</p>
        </div>
      </div>

      {/* ── Login card ───────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        <LoginForm
          registered={params.registered === "1"}
          verified={params.verified === "1"}
          invalidToken={params.error === "invalid-token"}
        />
      </div>

    </div>
  );
}
