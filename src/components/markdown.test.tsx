import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Markdown } from "./markdown";
import { MarkdownField } from "./markdown-field";

// Lists show bullets and numbers, and a "#" never adds a second h1 (audit staff:15).
describe("Markdown", () => {
  it("styles lists and turns h1 into h2", () => {
    const html = renderToStaticMarkup(
      <Markdown>{"# Big news\n\n- one\n- two\n\n1. first"}</Markdown>
    );
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Big news</h2>");
    expect(html).toContain("list-disc");
    expect(html).toContain("list-decimal");
  });
});

describe("MarkdownField", () => {
  it("previews with the same Markdown as the page", () => {
    const html = renderToStaticMarkup(
      <MarkdownField
        name="bodyMd"
        label="Body"
        defaultValue={"# Hi\n\n- one"}
      />
    );
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>Hi</h2>");
    expect(html).toContain("list-disc");
  });
});
