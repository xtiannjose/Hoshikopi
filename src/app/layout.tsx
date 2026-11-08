import type { Metadata } from "next";
import { Courier_Prime, Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { THEME_SCRIPT } from "@/components/theme";

import "./globals.css";

// The one display style used: 400 italic, static (about 23 kB, not the
// 81 kB variable font with every weight and optical size; PERF-06).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: "italic",
  weight: "400",
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});
// Typewriter accents only: prices in the printed menu, notes, dates.
const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: { default: "Hoshikopi", template: "%s | Hoshikopi" },
  description:
    "A concept cafe in Kapitolyo, Pasig. Order ahead for pickup and earn Stars.",
  // An invented cafe with a real neighbourhood: kept out of search until
  // the owner decides otherwise (ADR 0006). Crawlers may fetch pages, so
  // they see this; a robots.txt block would hide it from them.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme before React hydrates (ADR 0010).
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${jakarta.variable} ${courier.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only rounded-full px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
