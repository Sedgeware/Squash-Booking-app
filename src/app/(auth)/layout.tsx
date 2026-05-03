export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1220] to-[#0F172A] px-4 py-8">
      {children}
    </div>
  );
}
