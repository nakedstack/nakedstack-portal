import type { Metadata } from "next";
import "./globals.scss";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "nakedstack — Piattaforma di Conoscenza",
  description: "nakedstack: esplora e approfondisci qualsiasi argomento tecnico con spiegazioni interattive, diagrammi e AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
