import { generateSelector } from "./selector";
import type { ElementInspection, Rect } from "./types";

const TEXT_TAGS = new Set([
  "P",
  "SPAN",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "TD",
  "TH",
  "LABEL",
  "BLOCKQUOTE",
  "FIGCAPTION",
  "CAPTION",
  "LEGEND",
  "DT",
  "DD",
  "PRE",
  "CODE",
  "EM",
  "STRONG",
  "B",
  "I",
  "U",
  "S",
  "A",
  "TIME",
  "ADDRESS",
  "CITE",
  "Q",
  "ABBR",
  "DFN",
  "MARK",
  "SMALL",
  "SUB",
  "SUP",
]);

export function getPagePath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
}

export function getPageUrl(): string {
  if (typeof window === "undefined") return "/";
  return window.location.href;
}

export function roundRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function getDocumentRect(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return roundRect({
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  });
}

export function viewportToDocumentRect(rect: Rect): Rect {
  return roundRect({
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.width,
    height: rect.height,
  });
}

export function documentToViewportRect(rect: Rect): Rect {
  return {
    x: rect.x - window.scrollX,
    y: rect.y - window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

function normalizeText(text: string | null | undefined, max = 180): string | undefined {
  const normalized = text?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
}

function labelledByText(element: HTMLElement): string | undefined {
  const ids = element.getAttribute("aria-labelledby");
  if (!ids) return undefined;
  const text = ids
    .split(/\s+/)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent)
    .filter(Boolean)
    .join(" ");
  return normalizeText(text, 120);
}

export function getAccessibleName(element: HTMLElement): string | undefined {
  return (
    normalizeText(element.getAttribute("aria-label"), 120) ||
    labelledByText(element) ||
    normalizeText(element.getAttribute("alt"), 120) ||
    normalizeText(element.getAttribute("title"), 120) ||
    normalizeText(element.getAttribute("placeholder"), 120) ||
    normalizeText(element.textContent, 120)
  );
}

export function getTextSnippet(element: HTMLElement, selectedText?: string): string | undefined {
  return normalizeText(selectedText, 500) || normalizeText(element.textContent, 240);
}

export function getReadablePath(element: Element, maxDepth = 5): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && parts.length < maxDepth) {
    const tag = current.tagName.toLowerCase();
    if (tag === "html") break;
    if (tag === "body") {
      parts.unshift("body");
      break;
    }
    const id = current.getAttribute("id");
    const testId =
      current.getAttribute("data-testid") ||
      current.getAttribute("data-test") ||
      current.getAttribute("data-cy");
    const classes = Array.from(current.classList).slice(0, 2);
    let part = tag;
    if (id) part += `#${id}`;
    else if (testId) part += `[data-testid="${testId}"]`;
    else if (classes.length) part += `.${classes.join(".")}`;
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

export function inspectElement(element: HTMLElement, selectedText?: string): ElementInspection {
  return {
    selector: generateSelector(element),
    path: getReadablePath(element),
    tagName: element.tagName.toLowerCase(),
    idAttribute: element.id || undefined,
    classList: element.classList.length ? Array.from(element.classList) : undefined,
    textSnippet: getTextSnippet(element, selectedText),
    accessibleName: getAccessibleName(element),
    rect: getDocumentRect(element),
  };
}

export function isTextSelectionTarget(element: HTMLElement): boolean {
  return TEXT_TAGS.has(element.tagName) || element.isContentEditable;
}

export function asHTMLElement(target: EventTarget | null): HTMLElement | null {
  if (target instanceof HTMLElement) return target;
  if (target instanceof SVGElement) return target.closest("*") as HTMLElement | null;
  return null;
}

export function getSelectionText(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const text = window.getSelection()?.toString();
  return normalizeText(text, 500);
}

export function getBoundsForElements(elements: HTMLElement[]): Rect | null {
  if (elements.length === 0) return null;
  const rects = elements.map((element) => element.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return viewportToDocumentRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}
