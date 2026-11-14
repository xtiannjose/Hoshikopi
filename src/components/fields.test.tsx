import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { busy, Field } from "./fields";

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

describe("busy", () => {
  // `disabled` would drop focus to <body> (audit a11y:5).
  it("keeps the button focusable and ignores a press while pending", () => {
    const press = vi.fn();
    const event = { preventDefault: vi.fn() };
    const props = busy(true, press);
    props.onClick(event as never);
    expect(props["aria-disabled"]).toBe(true);
    expect(props).not.toHaveProperty("disabled");
    expect(event.preventDefault).toHaveBeenCalled();
    expect(press).not.toHaveBeenCalled();
  });

  it("lets the press through when idle", () => {
    const press = vi.fn();
    const event = { preventDefault: vi.fn() };
    busy(false, press).onClick(event as never);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(press).toHaveBeenCalled();
  });
});
