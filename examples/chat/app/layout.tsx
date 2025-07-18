import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axiomkit | Chat Example",
  description: "Axiomkit Lightweight Typescript framework",
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
