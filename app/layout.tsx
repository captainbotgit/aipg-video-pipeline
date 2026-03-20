import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIPG Video Pipeline",
  description: "Remotion video rendering pipeline — Vercel Sandbox",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
