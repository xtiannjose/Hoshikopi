import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

// The one branded share card for every page without its own photo (INFO-09).
export const alt =
  "Hoshikopi, a concept cafe in Kapitolyo, Pasig: a gold star on a night sky.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

export default async function Image() {
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
        <div style={{ fontFamily: "Fraunces", fontSize: 128, lineHeight: 1.1 }}>
          Hoshikopi
        </div>
        <div style={{ fontSize: 40, color: "#B9BFD3", marginTop: 16 }}>
          Your kopi, ready before you get here. Kapitolyo, Pasig.
        </div>
        <div style={{ fontSize: 26, color: "#B9BFD3", marginTop: 32 }}>
          A concept cafe. Orders and payments are for demonstration.
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fraunces, style: "italic" }],
    }
  );
}
