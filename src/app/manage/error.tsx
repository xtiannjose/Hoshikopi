"use client";

import { ErrorPanel } from "@/components/error-panel";

/** A Staff page that failed, inside the Staff frame (SEC1-05). */
export default function ManageError(props: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorPanel
      {...props}
      home={{ href: "/manage", label: "Back to Manage" }}
    />
  );
}
