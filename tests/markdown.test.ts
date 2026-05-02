import { describe, expect, it } from "vitest";
import { formatMarkdown } from "../src/markdown";
import type { Annotation } from "../src/types";

describe("formatMarkdown", () => {
  it("includes feedback, selector, metadata, snippet, and rect", () => {
    const annotation: Annotation = {
      id: "a1",
      number: 1,
      url: "http://localhost/page",
      path: "/page",
      selector: "#save",
      targetType: "element",
      feedback: "Make this primary",
      tagName: "button",
      idAttribute: "save",
      classList: ["btn", "secondary"],
      textSnippet: "Save draft",
      accessibleName: "Save draft",
      rect: { x: 10, y: 20, width: 100, height: 40 },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const markdown = formatMarkdown([annotation], "/page", "http://localhost/page");
    expect(markdown).toContain("### 1. element target");
    expect(markdown).toContain("Feedback: Make this primary");
    expect(markdown).toContain("Selector: `#save`");
    expect(markdown).toContain("Element: tag=button, id=save, classes=btn secondary");
    expect(markdown).toContain('Text/snippet: "Save draft"');
    expect(markdown).toContain("Rect: x=10, y=20, width=100, height=40");
  });
});
