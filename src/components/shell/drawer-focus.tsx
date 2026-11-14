"use client";

import { useEffect } from "react";

/**
 * Keyboard focus for the popover drawers (the phone menu, the Cart): opening
 * one moves focus to its Close button, and Tab past either end closes it, so
 * focus never walks into the page hidden behind. Esc and Close hand focus
 * back to the button that opened it; the browser does that (audit a11y:2).
 */
export function DrawerFocus() {
  useEffect(() => {
    // toggle does not bubble, so listen while it travels down.
    const opened = (event: Event) => {
      const drawer = event.target;
      if (
        drawer instanceof HTMLElement &&
        drawer.classList.contains("drawer") &&
        (event as ToggleEvent).newState === "open"
      ) {
        drawer
          .querySelector<HTMLElement>('[popovertargetaction="hide"]')
          ?.focus();
      }
    };
    // Focus landing anywhere outside an open drawer closes it, whichever
    // way Tab went (even round through the browser's own controls).
    const moved = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      for (const drawer of document.querySelectorAll<HTMLElement>(
        ".drawer:popover-open"
      )) {
        if (!drawer.contains(event.target)) drawer.hidePopover();
      }
    };
    document.addEventListener("toggle", opened, true);
    document.addEventListener("focusin", moved);
    return () => {
      document.removeEventListener("toggle", opened, true);
      document.removeEventListener("focusin", moved);
    };
  }, []);
  return null;
}
