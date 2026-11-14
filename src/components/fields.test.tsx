import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Field } from "./fields";

describe("Field", () => {
  // A select gets the same ties as an input (audit architecture:8).
  it("ties its hint and error to a select passed as a function", () => {
    const html = renderToStaticMarkup(
      <Field
        name="seats"
        label="Seats"
        hint="Up to 4."
        error="Choose how many."
      >
        {(control) => <select {...control} />}
      </Field>
    );
    expect(html).toContain(
      '<select id="seats" name="seats" aria-invalid="true" aria-describedby="seats-hint seats-error">'
    );
  });

  it("adds a shared description and invalid mark to its own", () => {
    const html = renderToStaticMarkup(
      createElement(Field, {
        name: "customerPhone",
        label: "Mobile number",
        "aria-describedby": "contact-rule",
        "aria-invalid": true,
      })
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="contact-rule"');
  });
});
