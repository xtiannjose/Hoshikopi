"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Focus is nowhere a keyboard user can see: <body>, or a hidden old page. */
const focusLost = () => {
  const el = document.activeElement;
  return !el || el === document.body || !el.checkVisibility();
};

/** Focus the visible page's h1, if it is there yet. */
function focusHeading() {
  const main = [...document.querySelectorAll<HTMLElement>("main")].find((el) =>
    el.checkVisibility()
  );
  const h1 = main?.querySelector<HTMLElement>("h1");
  if (!h1) return false;
  h1.tabIndex = -1;
  h1.focus({ preventScroll: true });
  return true;
}

/**
 * After a client navigation, focus the new page's h1, so the next Tab
 * starts in the new page. Next keeps the old page in the DOM with
 * display: none, so focus would otherwise drop to <body> and Tab jump to
 * the footer (WCAG 2.4.3, audit a11y:3). Not on first load, and not for a
 * hash or query change: the pathname stays the same.
 */
export function FocusOnNavigate() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    focusHeading();
    // The page may still be streaming in (Suspense): its heading may not be
    // there yet, or a loading heading that took focus is replaced by the
    // real one, which dropped focus to <body> (audit DC-20). For a few
    // seconds, whenever focus is lost, give it to the visible heading;
    // focus the person moved somewhere real is left alone.
    const observer = new MutationObserver(() => {
      if (focusLost()) focusHeading();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const stop = setTimeout(() => observer.disconnect(), 5000);
    return () => {
      observer.disconnect();
      clearTimeout(stop);
    };
  }, [pathname]);
  return null;
}
