"use client";

import { ErrorPanel } from "@/components/error-panel";

/** The Bar Screen failed, inside its frame (SEC1-05). */
export default function BarError(props: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel
      {...props}
      home={{ href: "/manage", label: "Back to Manage" }}
    />
  );
}
