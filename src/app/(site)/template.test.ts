import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// A template remounts only when its own child segment changes, so a folder
// with two or more pages under it needs its own (audit motion:8).
const site = fileURLToPath(new URL(".", import.meta.url));

function subfolders(dir: string) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name));
}

function hasPage(dir: string): boolean {
  return (
    existsSync(path.join(dir, "page.tsx")) || subfolders(dir).some(hasPage)
  );
}

function missingTemplates(dir: string): string[] {
  const children = subfolders(dir);
  const ways =
    (existsSync(path.join(dir, "page.tsx")) ? 1 : 0) +
    children.filter(hasPage).length;
  const here =
    ways >= 2 && !existsSync(path.join(dir, "template.tsx"))
      ? [path.relative(site, dir).replaceAll("\\", "/") || "."]
      : [];
  return [...here, ...children.flatMap(missingTemplates)];
}

describe("(site) templates", () => {
  it("every folder where two customer pages part ways has a template, so the page change fades (docs/05 section 7, audit motion:8)", () => {
    const missing = missingTemplates(site);
    expect(missing).toEqual([]);
  });
});
