import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/Providers";
import { isDemoMode } from "@/lib/mode";
import { DEMO_BANNER } from "@/lib/demo-data";
import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
  style: ["normal", "italic"],
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Arin's Study Diary",
  description:
    "A private, mobile-first study planner for Arin — HSC, medical & engineering prep.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#fff9f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const demo = isDemoMode();
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers demoMode={demo}>
          <AppShell demoBanner={demo ? DEMO_BANNER : null}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
