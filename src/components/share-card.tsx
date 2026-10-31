import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const SHARE_SIZE = { width: 1200, height: 630 };

const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** A 1200 by 630 share card on the night sky with the gold star (INFO-09). */
export async function shareCard(title: string, line: string) {
  const fraunces = await readFile(
    path.join(process.cwd(), "assets/fonts/Fraunces-Italic.ttf")
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#141B2E",
        color: "#EEF0F7",
      }}
    >
      <svg viewBox="0 0 24 24" width={96} height={96}>
        <path d={STAR} fill="#E8B74A" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "Fraunces", fontSize: 120, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 40, color: "#B9BFD3", marginTop: 16 }}>
          {line}
        </div>
        <div style={{ fontSize: 26, color: "#B9BFD3", marginTop: 32 }}>
          Hoshikopi, a concept cafe. Orders and payments are for demonstration.
        </div>
      </div>
    </div>,
    {
      ...SHARE_SIZE,
      fonts: [{ name: "Fraunces", data: fraunces, style: "italic" }],
    }
  );
}
