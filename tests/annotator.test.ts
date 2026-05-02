import { describe, expect, it, vi } from "vitest";
import { createAnnotator } from "../src";

function setRect(element: HTMLElement, rect: Partial<DOMRect>): void {
  const full = {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 100,
    bottom: 40,
    width: 100,
    height: 40,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  element.getBoundingClientRect = vi.fn(() => full);
}

function submitComposer(host: HTMLElement, text: string): void {
  const root = host.shadowRoot!;
  const textarea = root.querySelector<HTMLTextAreaElement>(".feedback")!;
  textarea.value = text;
  root.querySelector<HTMLButtonElement>('[data-action="composer-submit"]')!.click();
}

describe("createAnnotator", () => {
  it("mounts and unmounts the shadow overlay", () => {
    const annotator = createAnnotator({ enabled: false }).mount();
    const host = document.querySelector<HTMLElement>("[data-ui-annotator-host]");
    expect(host).toBeTruthy();
    const toolbar = host!.shadowRoot!.querySelector<HTMLElement>(".toolbar")!;
    expect(toolbar.dataset.position).toBe("bottom-center");
    expect(toolbar.style.bottom).toBe("20px");
    expect(toolbar.style.left).toBe("50%");
    expect(toolbar.style.transform).toBe("translateX(-50%)");
    expect(toolbar.style.top).toBe("");
    annotator.unmount();
    expect(document.querySelector("[data-ui-annotator-host]")).toBeNull();
  });

  it("supports a top-center toolbar position", () => {
    const annotator = createAnnotator({ enabled: false, position: "top-center" }).mount();
    const host = document.querySelector<HTMLElement>("[data-ui-annotator-host]")!;
    const toolbar = host.shadowRoot!.querySelector<HTMLElement>(".toolbar")!;
    expect(toolbar.dataset.position).toBe("top-center");
    expect(toolbar.style.top).toBe("20px");
    expect(toolbar.style.left).toBe("50%");
    expect(toolbar.style.transform).toBe("translateX(-50%)");
    expect(toolbar.style.bottom).toBe("");
    annotator.unmount();
  });

  it("creates, edits, deletes, and clears annotations", () => {
    document.body.innerHTML = '<button id="target" aria-label="Save">Save</button>';
    const button = document.querySelector<HTMLButtonElement>("#target")!;
    setRect(button, { left: 20, top: 30, right: 120, bottom: 70, width: 100, height: 40 });

    const annotator = createAnnotator({ enabled: true, copyToClipboard: false }).mount();
    button.click();

    const host = document.querySelector<HTMLElement>("[data-ui-annotator-host]")!;
    submitComposer(host, "Use stronger contrast");
    expect(annotator.getAnnotations()).toHaveLength(1);
    expect(annotator.getAnnotations()[0].feedback).toBe("Use stronger contrast");

    host.shadowRoot!.querySelector<HTMLButtonElement>("[data-marker-id]")!.click();
    submitComposer(host, "Use stronger contrast and larger type");
    expect(annotator.getAnnotations()[0].feedback).toBe("Use stronger contrast and larger type");

    host.shadowRoot!.querySelector<HTMLButtonElement>("[data-marker-id]")!.click();
    host.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="composer-delete"]')!.click();
    expect(annotator.getAnnotations()).toHaveLength(0);

    button.click();
    submitComposer(host, "Another note");
    expect(annotator.getAnnotations()).toHaveLength(1);
    annotator.clear();
    expect(annotator.getAnnotations()).toHaveLength(0);
    annotator.unmount();
  });

  it("blocks underlying click handlers while annotation mode is active", () => {
    document.body.innerHTML = '<button id="target">Save</button>';
    const button = document.querySelector<HTMLButtonElement>("#target")!;
    setRect(button, { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 });
    const handler = vi.fn();
    button.addEventListener("click", handler);

    const annotator = createAnnotator({ enabled: true }).mount();
    button.click();

    expect(handler).not.toHaveBeenCalled();
    expect(document.querySelector("[data-ui-annotator-host]")!.shadowRoot!.querySelector(".composer")).toBeTruthy();
    annotator.unmount();
  });

  it("annotates links without activating navigation handlers", () => {
    document.body.innerHTML =
      '<a id="docs-link" href="/docs"><span>Read docs</span></a>';
    const link = document.querySelector<HTMLAnchorElement>("#docs-link")!;
    const label = link.querySelector<HTMLSpanElement>("span")!;
    setRect(link, { left: 10, top: 20, right: 130, bottom: 50, width: 120, height: 30 });
    setRect(label, { left: 20, top: 25, right: 100, bottom: 45, width: 80, height: 20 });

    const pointerHandler = vi.fn();
    const clickHandler = vi.fn();
    link.addEventListener("pointerdown", pointerHandler);
    link.addEventListener("click", clickHandler);

    const annotator = createAnnotator({ enabled: true, copyToClipboard: false }).mount();
    const pointerEvent = new MouseEvent("pointerdown", { bubbles: true, cancelable: true });
    const pointerResult = label.dispatchEvent(pointerEvent);
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    const clickResult = label.dispatchEvent(clickEvent);

    expect(pointerResult).toBe(false);
    expect(clickResult).toBe(false);
    expect(pointerHandler).not.toHaveBeenCalled();
    expect(clickHandler).not.toHaveBeenCalled();

    const host = document.querySelector<HTMLElement>("[data-ui-annotator-host]")!;
    expect(host.shadowRoot!.querySelector(".composer")).toBeTruthy();
    submitComposer(host, "Change link label");

    expect(annotator.getAnnotations()).toMatchObject([
      {
        selector: "#docs-link",
        targetType: "element",
        feedback: "Change link label",
      },
    ]);
    annotator.unmount();
  });

  it("copies structured markdown", async () => {
    document.body.innerHTML = '<button id="target">Save</button>';
    const button = document.querySelector<HTMLButtonElement>("#target")!;
    setRect(button, { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 });

    const annotator = createAnnotator({ enabled: true }).mount();
    button.click();
    const host = document.querySelector<HTMLElement>("[data-ui-annotator-host]")!;
    submitComposer(host, "Fix label");

    const markdown = await annotator.copyMarkdown();
    expect(markdown).toContain("Fix label");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(markdown);
    annotator.unmount();
  });
});
