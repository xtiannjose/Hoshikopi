import { MANILA_OFFSET_MS } from "@/lib/manila-offset";

import { THEME_KEY } from "./theme-key";

/**
 * Script source for choice(): a saved Day or Night, else Day from 6 AM to
 * 6 PM Manila time and Night otherwise (ADR 0010). THEME_SCRIPT builds on it.
 */
export const CHOICE = `function choice(){var c;try{c=localStorage.getItem("${THEME_KEY}")}catch(e){}if(c!=="day"&&c!=="night"){var h=new Date(Date.now()+${MANILA_OFFSET_MS}).getUTCHours();c=h>=6&&h<18?"day":"night"}return c}`;

/**
 * The palette pick alone, for global-error's own document: it loads with
 * every page's JavaScript, so it skips THEME_SCRIPT's minute clock and
 * crossfade (docs/05 section 11 budget).
 */
export const THEME_PICK_SCRIPT = `(function(){${CHOICE}document.documentElement.dataset.theme=choice()})();`;
