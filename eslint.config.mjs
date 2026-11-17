import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import { moduleBoundary } from "./eslint.module-boundary.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: moduleBoundary },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "src/generated/**",
    // Claude Code agent worktrees are separate checkouts.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
