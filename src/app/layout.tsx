import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tamworth Squash Ladder",
  description: "Join the Tamworth Squash Ladder, challenge players, and climb the rankings.",
  openGraph: {
    title: "Tamworth Squash Ladder",
    description: "Join the Tamworth Squash Ladder, challenge players, and climb the rankings.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
