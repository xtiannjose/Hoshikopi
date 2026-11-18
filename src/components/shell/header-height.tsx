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
    // Setting a custom property on <html> restyles every element on the
    // page, so it is set only when the height differs from what the page
    // already has: the stylesheet's 68 px on most screens (batch 13.2).
    let current =
      parseFloat(getComputedStyle(header).getPropertyValue("--header-h")) *
      parseFloat(getComputedStyle(root).fontSize);
    const set = () => {
      const height = header.offsetHeight;
      if (height === current) return;
      current = height;
      root.style.setProperty("--header-h", `${height}px`);
    };
    set();
    const observer = new ResizeObserver(set);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return null;
}
