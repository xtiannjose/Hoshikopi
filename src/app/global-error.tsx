"use client";

import { THEME_SCRIPT } from "@/components/theme";

import "./globals.css";

/**
 * When the root layout itself fails (SEC1-05). It replaces that layout, so
 * it brings its own document, styles, palette and the Concept Notice; plain
 * links, since the app's router may be what broke.
 */
export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Something went wrong | Hoshikopi</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground flex min-h-dvh flex-col font-sans">
        <main
          id="main"
          className="page-width grid flex-1 content-center justify-items-start gap-4 py-16"
        >
          <p className="text-muted-foreground font-mono text-sm">Hoshikopi</p>
          <h1 className="font-display pb-1 text-5xl leading-[1.1] italic">
            Sorry, that didn&apos;t work
          </h1>
          <p className="text-muted-foreground max-w-measure text-lg">
            Something broke on our side, not yours. Try again, or start over
            from the home page.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-5 font-semibold"
            >
              Try again
            </button>
            {/* A full page load: the client router may be what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="border-input inline-flex min-h-11 items-center rounded-full border px-5 font-semibold no-underline"
            >
              Back home
            </a>
          </div>
          <p className="text-muted-foreground mt-6 font-mono text-sm">
            Hoshikopi is a concept cafe. Orders and payments here are for
            demonstration. <a href="/concept">About this concept</a>
          </p>
        </main>
      </body>
    </html>
  );
}
