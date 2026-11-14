"use client";

import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * When the focused control leaves the page (a Cart line's Remove, the last
 * Demo Mode step), focus would drop to <body> and a screen reader loses its
 * place (audit a11y:5). Move it to the nearest part of the page still
 * there: its first control, else the page's heading.
 */
export function KeepFocus() {
  useEffect(() => {
    // The focused control's ancestors, read while they are still attached.
    let path: Element[] = [];
    const onFocusIn = (event: FocusEvent) => {
      path = [];
      for (let el = event.target as Element | null; el; el = el.parentElement)
        path.push(el);
    };
    // A press on the page itself lets focus go on purpose; a press on a
    // control sets a new path right after.
    const onPointerDown = () => {
      path = [];
    };
    const observer = new MutationObserver(() => {
      if (!path.length || path[0].isConnected) return;
      const gone = path;
      path = [];
      if (document.activeElement !== document.body) return;
      for (const el of gone) {
        if (el === document.body) break;
        if (!el.isConnected) continue;
        const next = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
          (control) => control.checkVisibility()
        );
        if (next) return next.focus({ preventScroll: true });
      }
      const main = [...document.querySelectorAll("main")].find((el) =>
        el.checkVisibility()
      );
      const heading = main?.querySelector<HTMLElement>("h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
      observer.disconnect();
    };
  }, []);
  return null;
}
