import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pepe Padel Trainer",
  description: "Il tuo quaderno di allenamento digitale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
