import { asHTMLElement, isTextSelectionTarget } from "./inspect";
import type { Rect } from "./types";

type EventControllerCallbacks = {
  isEnabled: () => boolean;
  hasComposer: () => boolean;
  getOverlayHost: () => HTMLElement | null;
  onHover: (element: HTMLElement, event: MouseEvent) => void;
  onHoverClear: () => void;
  onElementClick: (element: HTMLElement, event: MouseEvent) => void;
  onComposerConflict: () => void;
  onDragPreview: (rect: Rect, elements: HTMLElement[]) => void;
  onDragComplete: (rect: Rect, elements: HTMLElement[]) => void;
  onMultiClick: (element: HTMLElement, event: MouseEvent) => void;
  onMultiCommit: () => void;
  onEscape: () => void;
};

const DRAG_THRESHOLD = 8;
const MEANINGFUL_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "img",
  "video",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "label",
  "td",
  "th",
  "section",
  "article",
  "nav",
  "header",
  "footer",
  "main",
  "[role]",
].join(",");

const ACTIVATION_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[onclick]",
].join(",");

function stopPageEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
}

function isInsideOverlay(event: Event, host: HTMLElement | null): boolean {
  if (!host) return false;
  const path = event.composedPath();
  return path.includes(host);
}

function getActivationTarget(element: HTMLElement): HTMLElement | null {
  return element.closest<HTMLElement>(ACTIVATION_SELECTOR);
}

function getAnnotationTarget(element: HTMLElement): HTMLElement {
  return getActivationTarget(element) ?? element;
}

function viewportRectFromPoints(start: { x: number; y: number }, end: { x: number; y: number }): Rect {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  return {
    x: left,
    y: top,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function intersects(a: Rect, b: DOMRect): boolean {
  return a.x < b.right && a.x + a.width > b.left && a.y < b.bottom && a.y + a.height > b.top;
}

function findIntersectingElements(rect: Rect, overlayHost: HTMLElement | null): HTMLElement[] {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(MEANINGFUL_SELECTOR));
  const matching = candidates.filter((element) => {
    if (overlayHost && overlayHost.contains(element)) return false;
    if (element.closest("[data-ui-annotator-host]")) return false;
    const box = element.getBoundingClientRect();
    if (box.width < 8 || box.height < 8) return false;
    if (box.width > window.innerWidth * 0.92 && box.height > window.innerHeight * 0.75) {
      return false;
    }
    return intersects(rect, box);
  });

  return matching.filter(
    (element) => !matching.some((other) => other !== element && element.contains(other)),
  );
}

export class DocumentEventController {
  private mounted = false;
  private mouseDown: { x: number; y: number; target: HTMLElement } | null = null;
  private dragging = false;
  private justFinishedDrag = false;
  private modifiers = { metaOrCtrl: false, shift: false };

  constructor(private callbacks: EventControllerCallbacks) {}

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    window.addEventListener("mousemove", this.handleMouseMove, true);
    window.addEventListener("pointerdown", this.handlePointerDown, true);
    window.addEventListener("mousedown", this.handleMouseDown, true);
    window.addEventListener("mouseup", this.handleMouseUp, true);
    window.addEventListener("click", this.handleClick, true);
    window.addEventListener("auxclick", this.handleAuxClick, true);
    document.addEventListener("keydown", this.handleKeyDown, true);
    document.addEventListener("keyup", this.handleKeyUp, true);
    window.addEventListener("blur", this.handleBlur);
  }

  destroy(): void {
    if (!this.mounted) return;
    this.mounted = false;
    window.removeEventListener("mousemove", this.handleMouseMove, true);
    window.removeEventListener("pointerdown", this.handlePointerDown, true);
    window.removeEventListener("mousedown", this.handleMouseDown, true);
    window.removeEventListener("mouseup", this.handleMouseUp, true);
    window.removeEventListener("click", this.handleClick, true);
    window.removeEventListener("auxclick", this.handleAuxClick, true);
    document.removeEventListener("keydown", this.handleKeyDown, true);
    document.removeEventListener("keyup", this.handleKeyUp, true);
    window.removeEventListener("blur", this.handleBlur);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (isInsideOverlay(event, this.callbacks.getOverlayHost())) {
      this.callbacks.onHoverClear();
      return;
    }

    if (this.mouseDown) {
      const rect = viewportRectFromPoints(this.mouseDown, { x: event.clientX, y: event.clientY });
      if (!this.dragging && Math.hypot(rect.width, rect.height) >= DRAG_THRESHOLD) {
        this.dragging = true;
      }
      if (this.dragging) {
        stopPageEvent(event);
        const elements = findIntersectingElements(rect, this.callbacks.getOverlayHost());
        this.callbacks.onDragPreview(rect, elements);
      }
      return;
    }

    if (this.callbacks.hasComposer()) return;
    const element = asHTMLElement(event.target);
    if (!element) {
      this.callbacks.onHoverClear();
      return;
    }
    this.callbacks.onHover(getAnnotationTarget(element), event);
  };

  private handleClick = (event: MouseEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;

    if (this.justFinishedDrag) {
      this.justFinishedDrag = false;
      stopPageEvent(event);
      return;
    }

    const element = asHTMLElement(event.target);
    if (!element) return;
    const annotationTarget = getAnnotationTarget(element);

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && !this.callbacks.hasComposer()) {
      stopPageEvent(event);
      this.callbacks.onMultiClick(annotationTarget, event);
      return;
    }

    if (this.callbacks.hasComposer()) {
      stopPageEvent(event);
      this.callbacks.onComposerConflict();
      return;
    }

    stopPageEvent(event);
    this.callbacks.onElementClick(annotationTarget, event);
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;

    const target = asHTMLElement(event.target);
    if (!target) return;

    if (this.callbacks.hasComposer() || getActivationTarget(target)) {
      stopPageEvent(event);
    }
  };

  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (event.button !== 0) return;
    if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;
    const target = asHTMLElement(event.target);
    if (!target) return;

    if (this.callbacks.hasComposer()) {
      stopPageEvent(event);
      return;
    }

    if (getActivationTarget(target)) {
      stopPageEvent(event);
      return;
    }

    if (isTextSelectionTarget(target)) return;
    stopPageEvent(event);
    this.mouseDown = { x: event.clientX, y: event.clientY, target };
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (this.callbacks.hasComposer() && !isInsideOverlay(event, this.callbacks.getOverlayHost())) {
      stopPageEvent(event);
      return;
    }
    if (!this.mouseDown) return;

    if (this.dragging) {
      const rect = viewportRectFromPoints(this.mouseDown, { x: event.clientX, y: event.clientY });
      const elements = findIntersectingElements(rect, this.callbacks.getOverlayHost());
      this.justFinishedDrag = true;
      stopPageEvent(event);
      this.callbacks.onDragComplete(rect, elements);
    }

    this.mouseDown = null;
    this.dragging = false;
  };

  private handleAuxClick = (event: MouseEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;
    stopPageEvent(event);
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.callbacks.onEscape();
      return;
    }
    if (event.key === "Meta" || event.key === "Control") this.modifiers.metaOrCtrl = true;
    if (event.key === "Shift") this.modifiers.shift = true;
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.callbacks.isEnabled()) return;
    const wasChord = this.modifiers.metaOrCtrl && this.modifiers.shift;
    if (event.key === "Meta" || event.key === "Control") this.modifiers.metaOrCtrl = false;
    if (event.key === "Shift") this.modifiers.shift = false;
    if (wasChord && !(this.modifiers.metaOrCtrl && this.modifiers.shift)) {
      this.callbacks.onMultiCommit();
    }
  };

  private handleBlur = (): void => {
    this.modifiers = { metaOrCtrl: false, shift: false };
  };
}
