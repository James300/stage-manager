import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Into the Woods | Rehearsal Scheduler",
  description: "Rehearsal planning for Into the Woods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}