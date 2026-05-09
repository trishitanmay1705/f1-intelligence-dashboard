// app/layout.tsx

import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

// Titillium Web = closest free font to F1's official typeface
// next/font automatically optimizes loading - no layout shift
const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F1 Intelligence Dashboard",
  description: "Real-time Formula 1 data, standings and race results",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={titilliumWeb.variable}>
      <body className="bg-f1-dark min-h-screen font-f1">
        <Navbar />
        <main className="page-enter">
          {children}
        </main>
      </body>
    </html>
  );
}