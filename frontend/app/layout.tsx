import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "F1 Intelligence Dashboard",
  description: "Real-time F1 data, standings and predictions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 min-h-screen">
        {/* Navbar shows on EVERY page automatically */}
        <Navbar />
        {/* Page content goes here */}
        <main>{children}</main>
      </body>
    </html>
  );
}