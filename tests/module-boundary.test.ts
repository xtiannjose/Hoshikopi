import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { moduleBoundary } from "../eslint.module-boundary.mjs";

// Only the boundary rule, not the full Next config, so the run is fast (audit tests:10).
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: true,
  overrideConfig: [{ files: ["**/*.{ts,tsx}"], rules: moduleBoundary }],
});

async function violations(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

describe("module boundary lint rule", () => {
  it("blocks alias imports into another module's internal/", async () => {
    const found = await violations(
      "src/app/page.tsx",
      'import { x } from "@/modules/menu/internal/queries";\nexport default x;\n'
    );
    expect(found).toHaveLength(1);
  });

  it("blocks relative imports into a sibling module's internal/", async () => {
    const found = await violations(
      "src/modules/ordering/index.ts",
      'import { x } from "../menu/internal/queries";\nexport default x;\n'
    );
    expect(found).toHaveLength(1);
  });

  it("allows a module to use its own internal/ and other modules' index", async () => {
    const own = await violations(
      "src/modules/ordering/index.ts",
      'import { x } from "./internal/place";\nexport default x;\n'
    );
    const other = await violations(
      "src/modules/ordering/index.ts",
      'import { y } from "@/modules/menu";\nexport default y;\n'
    );
    expect(own).toHaveLength(0);
    expect(other).toHaveLength(0);
  });
});
