import { CHOICE } from "./theme-pick";

export { THEME_KEY, type ThemeChoice } from "./theme-key";

/**
 * Runs in <head> before first paint (ADR 0010): Day from 6 AM to 6 PM Manila
 * time, Night otherwise, unless the visitor pinned one. It checks again every
 * minute so an open page turns at 6:00 and 18:00, crossfading where the
 * browser can (a hidden tab switches at once) (audit motion:9), and exposes
 * itself as window.hoshikopiTheme for the header switch, which crossfades
 * on its own.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;${CHOICE}function pick(){d.dataset.theme=choice()}pick();window.hoshikopiTheme=pick;setInterval(function(){var c=choice();if(c===d.dataset.theme)return;if(document.startViewTransition&&document.visibilityState==="visible")document.startViewTransition(function(){d.dataset.theme=c});else d.dataset.theme=c},60000)})();`;
