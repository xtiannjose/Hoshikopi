"use client";

import { ErrorPanel } from "@/components/error-panel";

/** A page that failed, inside the site's frame (SEC1-05). */
export default function SiteError(props: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorPanel {...props} home={{ href: "/menu", label: "See the menu" }} />
  );
}
