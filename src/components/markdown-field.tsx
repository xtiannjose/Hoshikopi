"use client";

import { useState } from "react";

import { fieldClass } from "@/components/fields";
import { Markdown } from "@/components/markdown";

/** A Markdown textarea with a live preview, no raw HTML (docs/03 section 14). */
export function MarkdownField({
  name,
  label,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
}) {
  const [text, setText] = useState(defaultValue);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="grid content-start gap-1.5">
        <label htmlFor={name} className="font-semibold">
          {label}
        </label>
        <p id={`${name}-hint`} className="text-muted-foreground text-sm">
          Markdown: **bold**, *italic*, - lists, [links](https://...).
        </p>
        <textarea
          id={name}
          name={name}
          rows={12}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={`${name}-hint${error ? ` ${name}-error` : ""}`}
          aria-invalid={error ? true : undefined}
          className={fieldClass}
        />
        {error && (
          <p id={`${name}-error`} className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      <section
        aria-label="Preview"
        className="bg-muted rounded-card grid content-start gap-3 p-4"
      >
        <p className="text-muted-foreground font-mono text-sm">Preview</p>
        {/* The same Markdown as the public page (audit staff:15). */}
        <Markdown>{text}</Markdown>
      </section>
    </div>
  );
}
