// Modules own their internals: import another module only through its
// index.ts. shortcut: relative cross-module imports are only caught up to
// three levels deep, upgrade to eslint-plugin-boundaries if modules nest more.
// Its own file, so tests/module-boundary.test.ts lints with this rule alone.
/** @type {import("eslint").Linter.RulesRecord} */
export const moduleBoundary = {
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
