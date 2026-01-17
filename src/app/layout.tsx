import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Player } from "@/components/player/Player";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MainContent } from "@/components/MainContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Podcast Sync",
  description: "Sync and play your favorite podcasts",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlayerProvider>
          <div className="flex flex-col min-h-screen bg-[#1a1a1a]">
            <Navigation />
            <MainContent>{children}</MainContent>
            <Player />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
