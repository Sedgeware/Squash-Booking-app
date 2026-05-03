import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rankd",
  description: "Climb. Compete. Connect. Challenge players, climb the rankings, and compete at the top.",
  openGraph: {
    title: "Rankd",
    description: "Climb. Compete. Connect. Challenge players, climb the rankings, and compete at the top.",
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
