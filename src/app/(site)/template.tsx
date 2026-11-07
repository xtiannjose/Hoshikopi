import { ViewTransition } from "react";

/**
 * Pages fade into each other on navigation (docs/05 section 7). Only
 * mounting and unmounting animate, so router.refresh() and Server Actions
 * (the Cart count, the Order status poll) never move the page. A template
 * remounts only when its own segment changes, so deeper folders re-export it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
