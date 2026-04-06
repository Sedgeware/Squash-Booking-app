import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900 px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-5 sm:mb-6">
          <div className="flex justify-center mb-3">
            <Image
              src="/uploads/avatars/Tamworth-Squash-logo.png"
              alt="Tamworth Squash"
              width={96}
              height={96}
              className="w-20 sm:w-24 h-auto"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Tamworth Squash Ladder</h1>
          <p className="text-brand-300 text-sm mt-1">Challenge players, track standings, and climb the rankings</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
