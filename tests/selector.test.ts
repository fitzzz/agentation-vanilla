import { describe, expect, it } from "vitest";
import { generateSelector } from "../src/selector";

describe("generateSelector", () => {
  it("prefers a unique id", () => {
    document.body.innerHTML = '<main><button id="save-button">Save</button></main>';
    expect(generateSelector(document.querySelector("button")!)).toBe("#save-button");
  });

  it("uses test attributes before class paths", () => {
    document.body.innerHTML =
      '<main><button data-testid="save" class="primary action">Save</button></main>';
    expect(generateSelector(document.querySelector("button")!)).toBe('[data-testid="save"]');
  });

  it("falls back to structural selectors", () => {
    document.body.innerHTML = "<main><section><button>One</button><button>Two</button></section></main>";
    expect(generateSelector(document.querySelectorAll("button")[1])).toContain(
      "button:nth-of-type(2)",
    );
  });
});
