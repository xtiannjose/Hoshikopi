import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Modules own their internals: import another module only through its
// index.ts. shortcut: relative cross-module imports are only caught up to
// three levels deep, upgrade to eslint-plugin-boundaries if modules nest more.
const moduleBoundary = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "**/modules/*/internal",
            "**/modules/*/internal/**",
            "../*/internal/**",
            "../../*/internal/**",
            "../../../*/internal/**",
          ],
          message:
            "Import another module only through its index.ts. Inside a module, use a relative path to its own internal/.",
        },
      ],
    },
  ],
};

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
  ]),
]);

export default eslintConfig;
