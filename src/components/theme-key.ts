// The saved palette choice, on its own: the header's client switch imports
// it, and importing theme.ts there shipped the whole THEME_SCRIPT string to
// every page's JavaScript (docs/05 section 11 budget).
export type ThemeChoice = "auto" | "day" | "night";

export const THEME_KEY = "hoshikopi-theme";
