import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateReach — A gentler way there",
  description:
    "Plan a journey around your needs, with shade-aware routing, places to pause, and offline preparation. Interactive demonstration neighborhood.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
