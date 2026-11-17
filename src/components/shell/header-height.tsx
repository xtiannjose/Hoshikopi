"use client";

import { useEffect } from "react";

/**
 * Keeps --header-h equal to the sticky header's real height (globals.css
 * sets 68 px, its usual height, for the first paint). The header grows when
 * a larger text size wraps it to two rows, and the Category tabs, sticky
 * side panels and scroll padding all sit below it.
 */
export function HeaderHeight() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return undefined;
    const root = document.documentElement;
    const set = () =>
      root.style.setProperty("--header-h", `${header.offsetHeight}px`);
    set();
    const observer = new ResizeObserver(set);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return null;
}
