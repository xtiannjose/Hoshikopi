import { MANILA_OFFSET_MS } from "@/lib/clock";

export type ThemeChoice = "auto" | "day" | "night";

export const THEME_KEY = "hoshikopi-theme";

/**
 * Runs in <head> before first paint (ADR 0010): Day from 6 AM to 6 PM Manila
 * time, Night otherwise, unless the visitor pinned one. It checks again every
 * minute so an open page turns at 6:00 and 18:00, and exposes itself as
 * window.hoshikopiTheme for the header switch.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;function pick(){var c;try{c=localStorage.getItem("${THEME_KEY}")}catch(e){}if(c!=="day"&&c!=="night"){var h=new Date(Date.now()+${MANILA_OFFSET_MS}).getUTCHours();c=h>=6&&h<18?"day":"night"}d.dataset.theme=c}pick();window.hoshikopiTheme=pick;setInterval(pick,60000)})();`;
