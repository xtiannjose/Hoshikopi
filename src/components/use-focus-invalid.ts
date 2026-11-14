"use client";

import { useEffect, useRef } from "react";

/**
 * After a refusal, take the Customer to the first field to fix, or to why.
 * The submit button is disabled while pending, so focus has dropped to
 * <body>; focusing the field also reads its error (audit a11y:4). Put
 * `form` on the <form> and `status` on the message shown without a field.
 */
export function useFocusInvalid(refused: boolean, state: unknown) {
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!refused) return;
    const invalid = form.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    if (invalid) invalid.focus();
    else status.current?.scrollIntoView({ block: "center" });
  }, [refused, state]);
  return { form, status };
}
