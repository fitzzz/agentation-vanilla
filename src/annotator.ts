import { DocumentEventController } from "./events";
import { freezeAnimations, isFrozen, unfreezeAnimations } from "./freeze";
import {
  documentToViewportRect,
  getBoundsForElements,
  getPagePath,
  getPageUrl,
  getSelectionText,
  inspectElement,
  roundRect,
  viewportToDocumentRect,
} from "./inspect";
import { formatMarkdown } from "./markdown";
import { OverlayRenderer, type OverlayAnnotationView } from "./overlay";
import { generateSelector, splitSelectorList } from "./selector";
import { AnnotationState } from "./state";
import { getStorageGroup, loadAnnotations, saveAnnotations } from "./storage";
import type {
  Annotation,
  AnnotationTargetType,
  Annotator,
  AnnotatorPosition,
  AnnotatorTheme,
  CreateAnnotatorOptions,
  ElementInspection,
  Rect,
} from "./types";

const DEFAULT_STORAGE_KEY = "ui-annotations";
const DEFAULT_Z_INDEX = 2147483000;

type Draft = ElementInspection & {
  key: string;
  targetType: AnnotationTargetType;
  url: string;
  path: string;
  point: { x: number; y: number };
  feedback?: string;
};

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `ann_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

function cloneAnnotations(annotations: Annotation[]): Annotation[] {
  return annotations.map((annotation) => ({
    ...annotation,
    classList: annotation.classList ? [...annotation.classList] : undefined,
    rect: { ...annotation.rect },
  }));
}

function getCurrentPath(options: CreateAnnotatorOptions): string {
  return options.pageId || getPagePath();
}

function getViewportRectForAnnotation(annotation: Annotation): Rect {
  if (annotation.targetType === "area") return documentToViewportRect(annotation.rect);

  try {
    if (annotation.targetType === "multi") {
      const selectors = splitSelectorList(annotation.selector);
      const elements = selectors
        .flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
        .filter(Boolean);
      const bounds = getBoundsForElements(elements);
      if (bounds) return documentToViewportRect(bounds);
    } else {
      const element = document.querySelector<HTMLElement>(annotation.selector);
      if (element) return documentToViewportRect(inspectElement(element).rect);
    }
  } catch {
    // Fall back to the stored rect for invalid or stale selectors.
  }

  return documentToViewportRect(annotation.rect);
}

function getAnnotationTitle(annotation: Annotation): string {
  if (annotation.accessibleName) return annotation.accessibleName;
  if (annotation.textSnippet) return annotation.textSnippet;
  if (annotation.tagName) return annotation.tagName;
  return annotation.targetType;
}

function getDraftTitle(draft: Draft): string {
  if (draft.targetType === "area") return "Area selection";
  if (draft.targetType === "multi") return `${draft.classList?.length ?? 0} element selection`;
  return draft.accessibleName || draft.textSnippet || draft.tagName || draft.targetType;
}

function pointForRect(rect: Rect): { x: number; y: number } {
  const viewport = documentToViewportRect(rect);
  return {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + Math.min(viewport.height / 2, 24),
  };
}

export class UIAnnotator implements Annotator {
  private mounted = false;
  private enabled = false;
  private showMarkers = true;
  private state = new AnnotationState();
  private overlay: OverlayRenderer;
  private events: DocumentEventController;
  private draft: Draft | null = null;
  private editing: Annotation | null = null;
  private hover: { rect: Rect; label: string } | undefined;
  private dragRect: Rect | undefined;
  private selectedRects: Rect[] = [];
  private multiSelection: HTMLElement[] = [];
  private storageKey: string;
  private storageGroup: string;
  private pagePath: string;

  constructor(private options: CreateAnnotatorOptions = {}) {
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    this.pagePath = getCurrentPath(options);
    this.storageGroup = getStorageGroup(this.pagePath, options.sessionId);
    this.enabled = !!options.enabled;

    this.overlay = new OverlayRenderer(options.labels, {
      onToggleEnabled: () => (this.enabled ? this.disable() : this.enable()),
      onToggleFrozen: () => this.toggleFrozen(),
      onToggleMarkers: () => {
        this.showMarkers = !this.showMarkers;
        this.render();
      },
      onCopy: () => void this.copyMarkdown(),
      onClear: () => this.clear(),
      onMarkerClick: (id) => this.startEdit(id),
      onMarkerDelete: (id) => this.deleteAnnotation(id),
      onComposerSubmit: (feedback) => this.submitComposer(feedback),
      onComposerCancel: () => this.cancelComposer(),
      onComposerDelete: () => {
        if (this.editing) this.deleteAnnotation(this.editing.id);
      },
    });

    this.events = new DocumentEventController({
      isEnabled: () => this.enabled,
      hasComposer: () => !!this.draft || !!this.editing,
      getOverlayHost: () => this.overlay.getHost(),
      onHover: (element) => this.setHover(element),
      onHoverClear: () => this.clearHover(),
      onElementClick: (element) => this.createElementDraft(element),
      onComposerConflict: () => this.render(),
      onDragPreview: (rect, elements) => this.updateDragPreview(rect, elements),
      onDragComplete: (rect, elements) => this.createDragDraft(rect, elements),
      onMultiClick: (element) => this.toggleMultiSelection(element),
      onMultiCommit: () => this.commitMultiSelection(),
      onEscape: () => this.handleEscape(),
    });
  }

  mount(): Annotator {
    if (this.mounted) return this;
    this.mounted = true;
    this.pagePath = getCurrentPath(this.options);
    this.storageGroup = getStorageGroup(this.pagePath, this.options.sessionId);
    this.state.setAll(loadAnnotations(this.storageKey, this.storageGroup));
    this.overlay.mount(this.options.zIndex ?? DEFAULT_Z_INDEX);
    this.events.mount();
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.addEventListener("resize", this.handleViewportChange);
    this.render();
    return this;
  }

  unmount(): void {
    if (!this.mounted) return;
    this.disable();
    this.events.destroy();
    this.overlay.unmount();
    window.removeEventListener("scroll", this.handleViewportChange, true);
    window.removeEventListener("resize", this.handleViewportChange);
    this.mounted = false;
  }

  enable(): void {
    this.enabled = true;
    this.render();
  }

  disable(): void {
    this.enabled = false;
    this.draft = null;
    this.editing = null;
    this.hover = undefined;
    this.dragRect = undefined;
    this.selectedRects = [];
    this.multiSelection = [];
    if (isFrozen()) unfreezeAnimations();
    this.render();
  }

  clear(): void {
    this.state.clear();
    this.draft = null;
    this.editing = null;
    this.persist();
    this.render();
  }

  getAnnotations(): Annotation[] {
    return this.state.getAll();
  }

  async copyMarkdown(): Promise<string> {
    const annotations = this.state.getAll();
    const markdown = formatMarkdown(annotations, this.pagePath, getPageUrl());
    if (markdown && this.options.copyToClipboard !== false) {
      try {
        await navigator.clipboard?.writeText(markdown);
      } catch {
        // Clipboard permissions vary by browser and protocol.
      }
    }
    this.options.onCopy?.(markdown);
    return markdown;
  }

  private handleViewportChange = (): void => {
    if (this.mounted) this.render();
  };

  private get position(): AnnotatorPosition {
    return this.options.position || "bottom-center";
  }

  private get theme(): AnnotatorTheme {
    return this.options.theme || "system";
  }

  private persist(): void {
    const annotations = this.state.getAll();
    saveAnnotations(this.storageKey, this.storageGroup, annotations);
    this.options.onChange?.(cloneAnnotations(annotations));
  }

  private render(): void {
    if (!this.mounted) return;
    const annotations = this.state.getAll();
    const views: OverlayAnnotationView[] = annotations.map((annotation) => ({
      annotation,
      viewportRect: getViewportRectForAnnotation(annotation),
    }));

    const composer = this.draft
      ? {
          key: this.draft.key,
          mode: "add" as const,
          title: getDraftTitle(this.draft),
          subtitle: this.draft.selector,
          selectedText: this.draft.targetType === "text" ? this.draft.textSnippet : undefined,
          initialFeedback: this.draft.feedback,
          position: this.draft.point,
          targetType: this.draft.targetType,
        }
      : this.editing
        ? {
            key: `edit:${this.editing.id}`,
            mode: "edit" as const,
            title: getAnnotationTitle(this.editing),
            subtitle: this.editing.selector,
            selectedText: this.editing.targetType === "text" ? this.editing.textSnippet : undefined,
            initialFeedback: this.editing.feedback,
            position: pointForRect(this.editing.rect),
            targetType: this.editing.targetType,
          }
        : undefined;

    this.overlay.render({
      enabled: this.enabled,
      frozen: isFrozen(),
      showMarkers: this.showMarkers,
      position: this.position,
      theme: this.theme,
      zIndex: this.options.zIndex ?? DEFAULT_Z_INDEX,
      annotations: views,
      hover: this.enabled && !composer ? this.hover : undefined,
      dragRect: this.dragRect,
      selectedRects: this.selectedRects,
      composer,
    });
  }

  private setHover(element: HTMLElement): void {
    if (!this.enabled || this.draft || this.editing) return;
    if (element.closest("[data-ui-annotator-host]")) return;
    const inspection = inspectElement(element, getSelectionText());
    this.hover = {
      rect: documentToViewportRect(inspection.rect),
      label: inspection.accessibleName || inspection.textSnippet || inspection.selector,
    };
    this.render();
  }

  private clearHover(): void {
    if (!this.hover) return;
    this.hover = undefined;
    this.render();
  }

  private createElementDraft(element: HTMLElement): void {
    const selectedText = getSelectionText();
    const inspection = inspectElement(element, selectedText);
    const rect = documentToViewportRect(inspection.rect);
    this.draft = {
      ...inspection,
      key: createId(),
      targetType: selectedText ? "text" : "element",
      url: getPageUrl(),
      path: this.pagePath,
      point: {
        x: rect.x + rect.width / 2,
        y: rect.y + Math.min(rect.height / 2, 24),
      },
    };
    this.hover = undefined;
    this.render();
  }

  private updateDragPreview(rect: Rect, elements: HTMLElement[]): void {
    this.dragRect = rect;
    this.selectedRects = elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.left,
        y: box.top,
        width: box.width,
        height: box.height,
      };
    });
    this.render();
  }

  private createDragDraft(rect: Rect, elements: HTMLElement[]): void {
    this.dragRect = undefined;
    this.selectedRects = [];

    if (elements.length > 0) {
      const bounds = getBoundsForElements(elements);
      if (!bounds) return;
      const first = inspectElement(elements[0]);
      const selectors = elements.map((element) => generateSelector(element));
      this.draft = {
        ...first,
        key: createId(),
        selector: selectors.join(", "),
        path: this.pagePath,
        url: getPageUrl(),
        targetType: elements.length === 1 ? "element" : "multi",
        rect: bounds,
        textSnippet:
          elements.length === 1
            ? first.textSnippet
            : `${elements.length} selected elements`,
        point: {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        },
      };
    } else if (rect.width >= 20 && rect.height >= 20) {
      const docRect = viewportToDocumentRect(rect);
      this.draft = {
        key: createId(),
        targetType: "area",
        url: getPageUrl(),
        path: this.pagePath,
        selector: `area(${Math.round(docRect.x)},${Math.round(docRect.y)},${Math.round(
          docRect.width,
        )},${Math.round(docRect.height)})`,
        rect: docRect,
        point: {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        },
      };
    }
    this.render();
  }

  private toggleMultiSelection(element: HTMLElement): void {
    const index = this.multiSelection.indexOf(element);
    if (index >= 0) this.multiSelection.splice(index, 1);
    else this.multiSelection.push(element);
    this.selectedRects = this.multiSelection.map((selected) => {
      const rect = selected.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    });
    this.render();
  }

  private commitMultiSelection(): void {
    if (this.multiSelection.length === 0) return;
    this.createDragDraft(
      this.selectedRects.reduce(
        (acc, rect) => {
          const right = Math.max(acc.x + acc.width, rect.x + rect.width);
          const bottom = Math.max(acc.y + acc.height, rect.y + rect.height);
          const left = Math.min(acc.x, rect.x);
          const top = Math.min(acc.y, rect.y);
          return { x: left, y: top, width: right - left, height: bottom - top };
        },
        this.selectedRects[0],
      ),
      this.multiSelection,
    );
    this.multiSelection = [];
  }

  private submitComposer(feedback: string): void {
    if (this.draft) {
      const now = new Date().toISOString();
      const annotation: Annotation = {
        id: createId(),
        number: this.state.getAll().length + 1,
        url: this.draft.url,
        path: this.draft.path,
        selector: this.draft.selector,
        targetType: this.draft.targetType,
        feedback,
        tagName: this.draft.tagName,
        idAttribute: this.draft.idAttribute,
        classList: this.draft.classList,
        textSnippet: this.draft.textSnippet,
        accessibleName: this.draft.accessibleName,
        rect: roundRect(this.draft.rect),
        createdAt: now,
        updatedAt: now,
      };
      this.state.add(annotation);
      this.draft = null;
      window.getSelection()?.removeAllRanges();
      this.persist();
      this.render();
      return;
    }

    if (this.editing) {
      this.state.update(this.editing.id, {
        feedback,
        updatedAt: new Date().toISOString(),
      });
      this.editing = null;
      this.persist();
      this.render();
    }
  }

  private cancelComposer(): void {
    this.draft = null;
    this.editing = null;
    this.dragRect = undefined;
    this.selectedRects = [];
    this.render();
  }

  private startEdit(id: string): void {
    const annotation = this.state.getAll().find((item) => item.id === id);
    if (!annotation) return;
    this.editing = annotation;
    this.draft = null;
    this.render();
  }

  private deleteAnnotation(id: string): void {
    this.state.delete(id);
    if (this.editing?.id === id) this.editing = null;
    this.persist();
    this.render();
  }

  private toggleFrozen(): void {
    if (isFrozen()) unfreezeAnimations();
    else freezeAnimations();
    this.render();
  }

  private handleEscape(): void {
    if (this.draft || this.editing || this.multiSelection.length > 0) {
      this.cancelComposer();
      this.multiSelection = [];
      return;
    }
    this.disable();
  }
}

export function createAnnotator(options: CreateAnnotatorOptions = {}): Annotator {
  return new UIAnnotator(options);
}
