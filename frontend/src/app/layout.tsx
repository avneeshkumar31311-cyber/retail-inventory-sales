import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "../components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetailSync | Inventory & Sales Management",
  description: "Retail inventory, product management, sales, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
