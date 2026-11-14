import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Photo } from "./photo";

const standIn = (kind: string) =>
  renderToStaticMarkup(
    createElement(Photo, { src: null, alt: "", kind, sizes: "100vw" })
  );

describe("Photo stand-in (ADR 0012)", () => {
  it("draws a seeded Category's icon", () => {
    expect(standIn("coffee")).toContain("<svg");
  });

  // A Manager can add or rename a Category to any slug (audit architecture:1).
  it("draws a fallback icon for a Category with no icon of its own", () => {
    expect(standIn("smoothies")).toContain("<svg");
  });

  it("is not fooled by a slug that names a built-in property", () => {
    expect(standIn("constructor")).toContain("<svg");
  });
});
