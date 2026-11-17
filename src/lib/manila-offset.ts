// Manila is UTC+8 all year (no daylight saving). On its own so the palette
// script can use it without bringing clock.ts's date formatters into every
// page's JavaScript through global-error (docs/05 section 11 budget).
export const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
