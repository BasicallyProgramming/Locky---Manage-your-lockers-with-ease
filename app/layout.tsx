import type { Metadata } from "next";
import { Oswald, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const oswald = Oswald({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Locker Room",
  description: "Locker assignment board and student lookup",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${plexMono.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
