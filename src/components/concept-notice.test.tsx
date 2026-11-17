import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConceptNotice } from "./concept-notice";

// One copy of the Concept Notice for every frame (audit architecture:12).
describe("ConceptNotice", () => {
  it("says the Concept Notice and links /concept", () => {
    const html = renderToStaticMarkup(<ConceptNotice />);
    expect(html).toContain(
      "Hoshikopi is a concept cafe. Orders and payments here are for demonstration."
    );
    expect(html).toContain('<a href="/concept">About this concept</a>');
  });

  it("keeps its base classes and adds the frame's own", () => {
    const html = renderToStaticMarkup(
      <ConceptNotice className="page-width py-6" />
    );
    expect(html).toMatch(/<p class="[^"]*text-muted-foreground/);
    expect(html).toMatch(/<p class="[^"]*font-mono[^"]*text-sm/);
    expect(html).toMatch(/<p class="[^"]*page-width py-6"/);
  });

  it("links with a plain <a> for global-error", () => {
    const html = renderToStaticMarkup(<ConceptNotice plain className="mt-6" />);
    expect(html).toContain('<a href="/concept">About this concept</a>');
    expect(html).toContain("mt-6");
  });
});
