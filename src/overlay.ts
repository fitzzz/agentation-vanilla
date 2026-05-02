import { mergeLabels } from "./labels";
import { OVERLAY_CSS } from "./styles";
import type {
  Annotation,
  AnnotationTargetType,
  AnnotatorLabels,
  AnnotatorPosition,
  AnnotatorTheme,
  Rect,
} from "./types";

type ComposerState = {
  key: string;
  mode: "add" | "edit";
  title: string;
  subtitle?: string;
  selectedText?: string;
  initialFeedback?: string;
  position: { x: number; y: number };
  targetType: AnnotationTargetType;
};

export type OverlayAnnotationView = {
  annotation: Annotation;
  viewportRect: Rect;
};

export type OverlayState = {
  enabled: boolean;
  frozen: boolean;
  showMarkers: boolean;
  position: AnnotatorPosition;
  theme: AnnotatorTheme;
  zIndex: number;
  annotations: OverlayAnnotationView[];
  hover?: { rect: Rect; label: string };
  dragRect?: Rect;
  selectedRects?: Rect[];
  composer?: ComposerState;
};

type OverlayCallbacks = {
  onToggleEnabled: () => void;
  onToggleFrozen: () => void;
  onToggleMarkers: () => void;
  onCopy: () => void;
  onClear: () => void;
  onMarkerClick: (id: string) => void;
  onMarkerDelete: (id: string) => void;
  onComposerSubmit: (feedback: string) => void;
  onComposerCancel: () => void;
  onComposerDelete: () => void;
};

const ICONS = {
  cursor:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 3l12 8-5 2 3 6-2.5 1.2-3-6-4 4V3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  pause:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  play:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5l11 7-11 7V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  eye:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" stroke="currentColor" stroke-width="1.8"/></svg>',
  eyeOff:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M9.8 5.4A9.3 9.3 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-2.1 2.8M6.2 6.8C3.8 8.6 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  copy:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  trash:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function applyToolbarPosition(toolbar: HTMLElement, position: AnnotatorPosition): void {
  toolbar.style.top = "";
  toolbar.style.right = "";
  toolbar.style.bottom = "";
  toolbar.style.left = "";
  toolbar.style.transform = "";

  if (position.startsWith("bottom")) toolbar.style.bottom = "20px";
  if (position.startsWith("top")) toolbar.style.top = "20px";
  if (position.endsWith("left")) toolbar.style.left = "20px";
  if (position.endsWith("right")) toolbar.style.right = "20px";
  if (position.endsWith("center")) {
    toolbar.style.left = "50%";
    toolbar.style.transform = "translateX(-50%)";
  }
}

export class OverlayRenderer {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private labels: AnnotatorLabels;
  private currentComposerKey: string | null = null;

  constructor(
    labels: Partial<AnnotatorLabels> | undefined,
    private callbacks: OverlayCallbacks,
  ) {
    this.labels = mergeLabels(labels);
  }

  mount(zIndex: number): HTMLDivElement {
    if (this.host) return this.host;

    const host = document.createElement("div");
    host.setAttribute("data-ui-annotator-host", "");
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = String(zIndex);
    host.style.pointerEvents = "none";

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${OVERLAY_CSS}</style>
      <div class="viewport">
        <div class="highlight" part="highlight"><span class="highlight-label"></span></div>
        <div class="drag-rect" part="drag-rect"></div>
        <div class="selected-rects" part="selected-rects"></div>
        <div class="pins" part="pins"></div>
        <div class="composer-root" part="composer-root"></div>
        <div class="toolbar" part="toolbar"></div>
      </div>
    `;

    shadow.addEventListener("click", this.handleShadowClick);
    shadow.addEventListener("contextmenu", this.handleShadowContextMenu);
    document.body.appendChild(host);

    this.host = host;
    this.shadow = shadow;
    return host;
  }

  unmount(): void {
    this.shadow?.removeEventListener("click", this.handleShadowClick);
    this.shadow?.removeEventListener("contextmenu", this.handleShadowContextMenu);
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.currentComposerKey = null;
  }

  getHost(): HTMLDivElement | null {
    return this.host;
  }

  render(state: OverlayState): void {
    if (!this.shadow || !this.host) return;

    this.host.style.zIndex = String(state.zIndex);
    this.shadow.host.setAttribute("data-theme", state.theme);
    this.shadow.host.setAttribute("data-enabled", String(state.enabled));

    this.renderToolbar(state);
    this.renderHover(state.hover);
    this.renderDrag(state.dragRect, state.selectedRects);
    this.renderPins(state.annotations, state.showMarkers);
    this.renderComposer(state.composer);
  }

  private handleShadowClick = (event: Event): void => {
    const target = event.target as Element | null;
    const actionTarget = target?.closest<HTMLElement>("[data-action]");
    const markerTarget = target?.closest<HTMLElement>("[data-marker-id]");

    if (actionTarget) {
      event.preventDefault();
      event.stopPropagation();
      const action = actionTarget.dataset.action;
      if (action === "toggle") this.callbacks.onToggleEnabled();
      if (action === "freeze") this.callbacks.onToggleFrozen();
      if (action === "markers") this.callbacks.onToggleMarkers();
      if (action === "copy") this.callbacks.onCopy();
      if (action === "clear") this.callbacks.onClear();
      if (action === "composer-submit") {
        const textarea = this.shadow?.querySelector<HTMLTextAreaElement>(".feedback");
        const feedback = textarea?.value.trim() ?? "";
        if (feedback) this.callbacks.onComposerSubmit(feedback);
      }
      if (action === "composer-cancel") this.callbacks.onComposerCancel();
      if (action === "composer-delete") this.callbacks.onComposerDelete();
      return;
    }

    if (markerTarget?.dataset.markerId) {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onMarkerClick(markerTarget.dataset.markerId);
    }
  };

  private handleShadowContextMenu = (event: Event): void => {
    const target = event.target as Element | null;
    const markerTarget = target?.closest<HTMLElement>("[data-marker-id]");
    if (!markerTarget?.dataset.markerId) return;
    event.preventDefault();
    event.stopPropagation();
    this.callbacks.onMarkerDelete(markerTarget.dataset.markerId);
  };

  private renderToolbar(state: OverlayState): void {
    const toolbar = this.shadow?.querySelector<HTMLElement>(".toolbar");
    if (!toolbar) return;

    toolbar.dataset.position = state.position;
    applyToolbarPosition(toolbar, state.position);
    toolbar.innerHTML = `
      <button class="tool ${state.enabled ? "active" : ""}" type="button" data-action="toggle" aria-label="${
        state.enabled ? this.labels.annotateOff : this.labels.annotateOn
      }" aria-pressed="${state.enabled}" title="${
        state.enabled ? this.labels.annotateOff : this.labels.annotateOn
      }">${ICONS.cursor}</button>
      <button class="tool ${state.frozen ? "active" : ""}" type="button" data-action="freeze" aria-label="${
        state.frozen ? this.labels.freezeOff : this.labels.freezeOn
      }" aria-pressed="${state.frozen}" title="${
        state.frozen ? this.labels.freezeOff : this.labels.freezeOn
      }">${state.frozen ? ICONS.play : ICONS.pause}</button>
      <button class="tool" type="button" data-action="markers" aria-label="${
        state.showMarkers ? this.labels.hideMarkers : this.labels.showMarkers
      }" aria-pressed="${state.showMarkers}" title="${
        state.showMarkers ? this.labels.hideMarkers : this.labels.showMarkers
      }">${state.showMarkers ? ICONS.eye : ICONS.eyeOff}</button>
      <button class="tool" type="button" data-action="copy" aria-label="${this.labels.copy}" title="${
        this.labels.copy
      }">${ICONS.copy}</button>
      <button class="tool danger" type="button" data-action="clear" aria-label="${this.labels.clear}" title="${
        this.labels.clear
      }">${ICONS.trash}</button>
      <span class="badge" aria-live="polite">${state.annotations.length}</span>
    `;
  }

  private renderHover(hover?: { rect: Rect; label: string }): void {
    const highlight = this.shadow?.querySelector<HTMLElement>(".highlight");
    const label = this.shadow?.querySelector<HTMLElement>(".highlight-label");
    if (!highlight || !label) return;

    if (!hover || hover.rect.width <= 0 || hover.rect.height <= 0) {
      highlight.style.display = "none";
      return;
    }

    highlight.style.display = "block";
    highlight.style.transform = `translate(${hover.rect.x}px, ${hover.rect.y}px)`;
    highlight.style.width = `${hover.rect.width}px`;
    highlight.style.height = `${hover.rect.height}px`;
    label.textContent = hover.label;
  }

  private renderDrag(dragRect?: Rect, selectedRects: Rect[] = []): void {
    const drag = this.shadow?.querySelector<HTMLElement>(".drag-rect");
    const selectedRoot = this.shadow?.querySelector<HTMLElement>(".selected-rects");
    if (!drag || !selectedRoot) return;

    if (dragRect) {
      drag.style.display = "block";
      drag.style.transform = `translate(${dragRect.x}px, ${dragRect.y}px)`;
      drag.style.width = `${dragRect.width}px`;
      drag.style.height = `${dragRect.height}px`;
    } else {
      drag.style.display = "none";
    }

    selectedRoot.innerHTML = selectedRects
      .map(
        (rect) =>
          `<div class="selected-highlight" style="display:block;transform:translate(${rect.x}px, ${rect.y}px);width:${rect.width}px;height:${rect.height}px"></div>`,
      )
      .join("");
  }

  private renderPins(views: OverlayAnnotationView[], showMarkers: boolean): void {
    const pins = this.shadow?.querySelector<HTMLElement>(".pins");
    if (!pins) return;
    if (!showMarkers) {
      pins.innerHTML = "";
      return;
    }

    pins.innerHTML = views
      .map(({ annotation, viewportRect }) => {
        const centerX = viewportRect.x + viewportRect.width / 2;
        const y =
          annotation.targetType === "element" || annotation.targetType === "text"
            ? viewportRect.y
            : viewportRect.y + viewportRect.height / 2;
        const note = truncate(annotation.feedback, 140);
        return `
          <button class="pin" type="button" data-marker-id="${annotation.id}" data-target-type="${
            annotation.targetType
          }" aria-label="Annotation ${annotation.number}" style="left:${centerX}px;top:${y}px">
            ${annotation.number}
            <span class="pin-tooltip">${escapeHtml(note)}</span>
          </button>
        `;
      })
      .join("");
  }

  private renderComposer(composer?: ComposerState): void {
    const root = this.shadow?.querySelector<HTMLElement>(".composer-root");
    if (!root) return;

    if (!composer) {
      root.innerHTML = "";
      this.currentComposerKey = null;
      return;
    }

    const left = clamp(composer.position.x + 14, 12, window.innerWidth - 352);
    const top =
      composer.position.y > window.innerHeight - 260
        ? clamp(composer.position.y - 230, 12, window.innerHeight - 230)
        : clamp(composer.position.y + 14, 12, window.innerHeight - 230);

    if (this.currentComposerKey === composer.key) {
      const popup = root.querySelector<HTMLElement>(".composer");
      if (popup) {
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
      }
      return;
    }

    this.currentComposerKey = composer.key;
    const isEdit = composer.mode === "edit";
    root.innerHTML = `
      <div class="composer" data-composer style="left:${left}px;top:${top}px">
        <div class="composer-header">
          <span class="composer-title">${escapeHtml(composer.title)}</span>
          ${
            composer.subtitle
              ? `<span class="composer-subtitle">${escapeHtml(composer.subtitle)}</span>`
              : ""
          }
          ${
            composer.selectedText
              ? `<div class="quote"><strong>${escapeHtml(
                  this.labels.selectedTextLabel,
                )}:</strong> ${escapeHtml(truncate(composer.selectedText, 150))}</div>`
              : ""
          }
        </div>
        <textarea class="feedback" placeholder="${escapeHtml(
          isEdit ? this.labels.editFeedbackPlaceholder : this.labels.feedbackPlaceholder,
        )}">${escapeHtml(composer.initialFeedback ?? "")}</textarea>
        <div class="composer-actions">
          <div class="action-group">
            ${
              isEdit
                ? `<button class="text-button danger" type="button" data-action="composer-delete">${this.labels.delete}</button>`
                : ""
            }
          </div>
          <div class="action-group">
            <button class="text-button" type="button" data-action="composer-cancel">${this.labels.cancel}</button>
            <button class="text-button primary" type="button" data-action="composer-submit">${
              isEdit ? this.labels.save : this.labels.add
            }</button>
          </div>
        </div>
      </div>
    `;

    queueMicrotask(() => {
      const textarea = this.shadow?.querySelector<HTMLTextAreaElement>(".feedback");
      textarea?.focus();
      if (textarea) textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    });
  }
}
