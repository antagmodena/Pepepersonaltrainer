import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "MyPadelog – Allenamenti & Partite",
  description: "Il tuo diario di allenamento padel - Traccia progressi, organizza partite, gestisci leghe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyPadelog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F59E0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }` }} />
        <main className="min-h-screen pb-nav">
          {children}
        </main>
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
