import { z } from "zod";

// NUL and the other control characters, except tab and line breaks.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * Text Postgres can store and a person meant to type. A NUL makes Postgres
 * refuse the write, so a script sending one got a 500 (audit SEC2-10).
 */
export const isPlainText = (value: string) => !value.match(CONTROL);

/** The same text with hidden characters left out. */
export const withoutControl = (value: string) => value.replace(CONTROL, "");

/** A form field that refuses hidden characters in plain words. */
export const plainText = z
  .string()
  .refine(
    isPlainText,
    "This has a hidden character we can't save. Try typing it again."
  );
