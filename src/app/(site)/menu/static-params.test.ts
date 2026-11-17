import { describe, expect, it, vi } from "vitest";

import { generateStaticParams as categories } from "./[category]/page";
import { generateStaticParams as shareCards } from "./item/[slug]/opengraph-image";
import { generateStaticParams as items } from "./item/[slug]/page";

// Every Category Hidden: no slugs, and Cache Components refuses an empty
// list, so the next deploy failed to build (audit DC-27).
vi.mock("@/modules/menu", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/menu")>()),
  menuSlugs: async () => ({ categories: [], items: [] }),
}));

describe("menu pages with nothing on the menu", () => {
  it("still give the build one address, which is not found", async () => {
    expect(await categories()).toEqual([{ category: "none" }]);
    expect(await items()).toEqual([{ slug: "none" }]);
    expect(await shareCards()).toEqual([{ slug: "none" }]);
  });
});
