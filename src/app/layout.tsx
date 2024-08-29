import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeApp } from "./init";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TLDL News",
  description: "AI Generated Newsletters from Podcasts",
};

if (typeof window === 'undefined') {
  initializeApp();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
