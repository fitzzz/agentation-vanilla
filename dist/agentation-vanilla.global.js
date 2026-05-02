"use strict";
var AgentationVanilla = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    UIAnnotator: () => UIAnnotator,
    clearAnnotations: () => clearAnnotations,
    createAnnotator: () => createAnnotator,
    formatMarkdown: () => formatMarkdown,
    generateSelector: () => generateSelector,
    getStorageGroup: () => getStorageGroup,
    loadAnnotations: () => loadAnnotations,
    saveAnnotations: () => saveAnnotations
  });

  // src/selector.ts
  var DATA_ATTRIBUTES = ["data-testid", "data-test", "data-cy"];
  function getDocument(element) {
    return element.ownerDocument || document;
  }
  function cssEscape(value) {
    const nativeEscape = globalThis.CSS?.escape;
    if (nativeEscape) return nativeEscape(value);
    return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (match, digit) => {
      if (digit) return `\\3${digit} `;
      return `\\${match}`;
    });
  }
  function attrEscape(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function isUnique(element, selector) {
    try {
      const matches = getDocument(element).querySelectorAll(selector);
      return matches.length === 1 && matches[0] === element;
    } catch {
      return false;
    }
  }
  function isUniqueSelector(element, selector) {
    try {
      return getDocument(element).querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  }
  function isMeaningfulClass(className) {
    if (className.length < 3) return false;
    if (/^[a-z]{1,2}$/.test(className)) return false;
    if (/^[a-f0-9]{6,}$/i.test(className)) return false;
    if (/[A-Za-z0-9_-]*__[A-Za-z0-9_-]*___[A-Za-z0-9_-]+/.test(className)) {
      return false;
    }
    if (/^[A-Za-z]+_[A-Za-z0-9_-]{5,}$/.test(className)) return false;
    return true;
  }
  function classSelector(element) {
    const meaningful = Array.from(element.classList).filter(isMeaningfulClass).slice(0, 2);
    if (meaningful.length === 0) return null;
    const tag = element.tagName.toLowerCase();
    return `${tag}.${meaningful.map(cssEscape).join(".")}`;
  }
  function nthOfTypeSelector(element) {
    const tag = element.tagName.toLowerCase();
    let index = 1;
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === element.tagName) index += 1;
      sibling = sibling.previousElementSibling;
    }
    return `${tag}:nth-of-type(${index})`;
  }
  function stableSegment(element) {
    const classPart = classSelector(element);
    return classPart || nthOfTypeSelector(element);
  }
  function generateSelector(element) {
    const id = element.getAttribute("id");
    if (id) {
      const selector = `#${cssEscape(id)}`;
      if (isUnique(element, selector)) return selector;
    }
    for (const attr of DATA_ATTRIBUTES) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const selector = `[${attr}="${attrEscape(value)}"]`;
      if (isUnique(element, selector)) return selector;
    }
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      const selector = `[aria-label="${attrEscape(ariaLabel)}"]`;
      if (isUnique(element, selector)) return selector;
      const withTag = `${element.tagName.toLowerCase()}${selector}`;
      if (isUnique(element, withTag)) return withTag;
    }
    const classPart = classSelector(element);
    if (classPart && isUnique(element, classPart)) return classPart;
    const path = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tag = current.tagName.toLowerCase();
      if (tag === "html") break;
      if (tag === "body") {
        path.unshift("body");
        break;
      }
      const idValue = current.getAttribute("id");
      if (idValue) {
        path.unshift(`#${cssEscape(idValue)}`);
        const selector2 = path.join(" > ");
        if (isUniqueSelector(element, selector2)) return selector2;
        break;
      }
      path.unshift(stableSegment(current));
      const selector = path.join(" > ");
      if (isUnique(element, selector)) return selector;
      current = current.parentElement;
    }
    return path.join(" > ") || element.tagName.toLowerCase();
  }
  function splitSelectorList(selector) {
    return selector.split(",").map((part) => part.trim()).filter(Boolean);
  }

  // src/inspect.ts
  var TEXT_TAGS = /* @__PURE__ */ new Set([
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
    "SUP"
  ]);
  function getPagePath() {
    if (typeof window === "undefined") return "/";
    return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
  }
  function getPageUrl() {
    if (typeof window === "undefined") return "/";
    return window.location.href;
  }
  function roundRect(rect) {
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }
  function getDocumentRect(element) {
    const rect = element.getBoundingClientRect();
    return roundRect({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    });
  }
  function viewportToDocumentRect(rect) {
    return roundRect({
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height
    });
  }
  function documentToViewportRect(rect) {
    return {
      x: rect.x - window.scrollX,
      y: rect.y - window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }
  function normalizeText(text, max = 180) {
    const normalized = text?.replace(/\s+/g, " ").trim();
    if (!normalized) return void 0;
    return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
  }
  function labelledByText(element) {
    const ids = element.getAttribute("aria-labelledby");
    if (!ids) return void 0;
    const text = ids.split(/\s+/).map((id) => element.ownerDocument.getElementById(id)?.textContent).filter(Boolean).join(" ");
    return normalizeText(text, 120);
  }
  function getAccessibleName(element) {
    return normalizeText(element.getAttribute("aria-label"), 120) || labelledByText(element) || normalizeText(element.getAttribute("alt"), 120) || normalizeText(element.getAttribute("title"), 120) || normalizeText(element.getAttribute("placeholder"), 120) || normalizeText(element.textContent, 120);
  }
  function getTextSnippet(element, selectedText) {
    return normalizeText(selectedText, 500) || normalizeText(element.textContent, 240);
  }
  function getReadablePath(element, maxDepth = 5) {
    const parts = [];
    let current = element;
    while (current && parts.length < maxDepth) {
      const tag = current.tagName.toLowerCase();
      if (tag === "html") break;
      if (tag === "body") {
        parts.unshift("body");
        break;
      }
      const id = current.getAttribute("id");
      const testId = current.getAttribute("data-testid") || current.getAttribute("data-test") || current.getAttribute("data-cy");
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
  function inspectElement(element, selectedText) {
    return {
      selector: generateSelector(element),
      path: getReadablePath(element),
      tagName: element.tagName.toLowerCase(),
      idAttribute: element.id || void 0,
      classList: element.classList.length ? Array.from(element.classList) : void 0,
      textSnippet: getTextSnippet(element, selectedText),
      accessibleName: getAccessibleName(element),
      rect: getDocumentRect(element)
    };
  }
  function isTextSelectionTarget(element) {
    return TEXT_TAGS.has(element.tagName) || element.isContentEditable;
  }
  function asHTMLElement(target) {
    if (target instanceof HTMLElement) return target;
    if (target instanceof SVGElement) return target.closest("*");
    return null;
  }
  function getSelectionText() {
    if (typeof window === "undefined") return void 0;
    const text = window.getSelection()?.toString();
    return normalizeText(text, 500);
  }
  function getBoundsForElements(elements) {
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
      height: bottom - top
    });
  }

  // src/events.ts
  var DRAG_THRESHOLD = 8;
  var MEANINGFUL_SELECTOR = [
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
    "[role]"
  ].join(",");
  function stopPageEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
  }
  function isInsideOverlay(event, host) {
    if (!host) return false;
    const path = event.composedPath();
    return path.includes(host);
  }
  function viewportRectFromPoints(start, end) {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    return {
      x: left,
      y: top,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
  }
  function intersects(a, b) {
    return a.x < b.right && a.x + a.width > b.left && a.y < b.bottom && a.y + a.height > b.top;
  }
  function findIntersectingElements(rect, overlayHost) {
    const candidates = Array.from(document.querySelectorAll(MEANINGFUL_SELECTOR));
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
      (element) => !matching.some((other) => other !== element && element.contains(other))
    );
  }
  var DocumentEventController = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
      this.mounted = false;
      this.mouseDown = null;
      this.dragging = false;
      this.justFinishedDrag = false;
      this.modifiers = { metaOrCtrl: false, shift: false };
      this.handleMouseMove = (event) => {
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
        this.callbacks.onHover(element, event);
      };
      this.handleClick = (event) => {
        if (!this.callbacks.isEnabled()) return;
        if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;
        if (this.justFinishedDrag) {
          this.justFinishedDrag = false;
          stopPageEvent(event);
          return;
        }
        const element = asHTMLElement(event.target);
        if (!element) return;
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && !this.callbacks.hasComposer()) {
          stopPageEvent(event);
          this.callbacks.onMultiClick(element, event);
          return;
        }
        if (this.callbacks.hasComposer()) {
          stopPageEvent(event);
          this.callbacks.onComposerConflict();
          return;
        }
        stopPageEvent(event);
        this.callbacks.onElementClick(element, event);
      };
      this.handleMouseDown = (event) => {
        if (!this.callbacks.isEnabled() || this.callbacks.hasComposer()) return;
        if (event.button !== 0) return;
        if (isInsideOverlay(event, this.callbacks.getOverlayHost())) return;
        const target = asHTMLElement(event.target);
        if (!target || isTextSelectionTarget(target)) return;
        this.mouseDown = { x: event.clientX, y: event.clientY, target };
      };
      this.handleMouseUp = (event) => {
        if (!this.callbacks.isEnabled()) return;
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
      this.handleKeyDown = (event) => {
        if (!this.callbacks.isEnabled()) return;
        if (event.key === "Escape") {
          event.preventDefault();
          this.callbacks.onEscape();
          return;
        }
        if (event.key === "Meta" || event.key === "Control") this.modifiers.metaOrCtrl = true;
        if (event.key === "Shift") this.modifiers.shift = true;
      };
      this.handleKeyUp = (event) => {
        if (!this.callbacks.isEnabled()) return;
        const wasChord = this.modifiers.metaOrCtrl && this.modifiers.shift;
        if (event.key === "Meta" || event.key === "Control") this.modifiers.metaOrCtrl = false;
        if (event.key === "Shift") this.modifiers.shift = false;
        if (wasChord && !(this.modifiers.metaOrCtrl && this.modifiers.shift)) {
          this.callbacks.onMultiCommit();
        }
      };
      this.handleBlur = () => {
        this.modifiers = { metaOrCtrl: false, shift: false };
      };
    }
    mount() {
      if (this.mounted) return;
      this.mounted = true;
      document.addEventListener("mousemove", this.handleMouseMove, true);
      document.addEventListener("click", this.handleClick, true);
      document.addEventListener("mousedown", this.handleMouseDown, true);
      document.addEventListener("mouseup", this.handleMouseUp, true);
      document.addEventListener("keydown", this.handleKeyDown, true);
      document.addEventListener("keyup", this.handleKeyUp, true);
      window.addEventListener("blur", this.handleBlur);
    }
    destroy() {
      if (!this.mounted) return;
      this.mounted = false;
      document.removeEventListener("mousemove", this.handleMouseMove, true);
      document.removeEventListener("click", this.handleClick, true);
      document.removeEventListener("mousedown", this.handleMouseDown, true);
      document.removeEventListener("mouseup", this.handleMouseUp, true);
      document.removeEventListener("keydown", this.handleKeyDown, true);
      document.removeEventListener("keyup", this.handleKeyUp, true);
      window.removeEventListener("blur", this.handleBlur);
    }
  };

  // src/freeze.ts
  var STYLE_ID = "ui-annotator-freeze-style";
  var PAUSED_VIDEO_ATTR = "data-ui-annotator-was-playing";
  var frozen = false;
  var pausedAnimations = [];
  function isOverlayElement(element) {
    return !!element?.closest("[data-ui-annotator-host]");
  }
  function freezeAnimations() {
    if (typeof document === "undefined" || frozen) return;
    frozen = true;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
    }
    style.textContent = `
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *),
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *)::before,
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *)::after {
      animation-play-state: paused !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `;
    document.head.appendChild(style);
    pausedAnimations = [];
    try {
      for (const animation of document.getAnimations()) {
        const target = animation.effect?.target;
        if (animation.playState === "running" && !isOverlayElement(target)) {
          animation.pause();
          pausedAnimations.push(animation);
        }
      }
    } catch {
      pausedAnimations = [];
    }
    document.querySelectorAll("video").forEach((video) => {
      if (!video.paused) {
        video.setAttribute(PAUSED_VIDEO_ATTR, "true");
        video.pause();
      }
    });
  }
  function unfreezeAnimations() {
    if (typeof document === "undefined" || !frozen) return;
    frozen = false;
    document.getElementById(STYLE_ID)?.remove();
    for (const animation of pausedAnimations) {
      try {
        animation.play();
      } catch {
      }
    }
    pausedAnimations = [];
    document.querySelectorAll(`video[${PAUSED_VIDEO_ATTR}]`).forEach((video) => {
      video.removeAttribute(PAUSED_VIDEO_ATTR);
      void video.play().catch(() => void 0);
    });
  }
  function isFrozen() {
    return frozen;
  }

  // src/markdown.ts
  function escapeBackticks(value) {
    return value.replace(/`/g, "\\`");
  }
  function quote(value) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  function formatRect(rect) {
    return `x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(
      rect.width
    )}, height=${Math.round(rect.height)}`;
  }
  function formatMarkdown(annotations, pagePath, pageUrl) {
    if (annotations.length === 0) return "";
    const viewport = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown";
    const lines = [
      `## UI annotations for ${pagePath}`,
      "",
      pageUrl ? `Page URL: ${pageUrl}` : void 0,
      `Viewport: ${viewport}`,
      ""
    ].filter((line) => line !== void 0);
    for (const annotation of annotations) {
      lines.push(`### ${annotation.number}. ${annotation.targetType} target`);
      lines.push(`Feedback: ${annotation.feedback}`);
      lines.push(`Selector: \`${escapeBackticks(annotation.selector)}\``);
      lines.push(`Page path: ${annotation.path}`);
      const metadata = [];
      if (annotation.tagName) metadata.push(`tag=${annotation.tagName}`);
      if (annotation.idAttribute) metadata.push(`id=${annotation.idAttribute}`);
      if (annotation.classList?.length) metadata.push(`classes=${annotation.classList.join(" ")}`);
      if (metadata.length > 0) lines.push(`Element: ${metadata.join(", ")}`);
      if (annotation.accessibleName) {
        lines.push(`Accessible name: ${quote(annotation.accessibleName)}`);
      }
      if (annotation.textSnippet) {
        lines.push(`Text/snippet: ${quote(annotation.textSnippet)}`);
      }
      lines.push(`Rect: ${formatRect(annotation.rect)}`);
      lines.push(`Created: ${annotation.createdAt}`);
      if (annotation.updatedAt !== annotation.createdAt) {
        lines.push(`Updated: ${annotation.updatedAt}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }

  // src/labels.ts
  var DEFAULT_LABELS = {
    annotateOn: "Turn annotation mode on",
    annotateOff: "Turn annotation mode off",
    freezeOn: "Pause animations",
    freezeOff: "Resume animations",
    showMarkers: "Show annotation pins",
    hideMarkers: "Hide annotation pins",
    copy: "Copy markdown",
    clear: "Clear annotations",
    cancel: "Cancel",
    delete: "Delete",
    add: "Add",
    save: "Save",
    feedbackPlaceholder: "What should change?",
    editFeedbackPlaceholder: "Update the feedback",
    selectedTextLabel: "Selected text"
  };
  function mergeLabels(labels) {
    return { ...DEFAULT_LABELS, ...labels };
  }

  // src/styles.ts
  var OVERLAY_CSS = `
:host {
  all: initial;
  --uia-bg: #171717;
  --uia-bg-soft: #262626;
  --uia-surface: #ffffff;
  --uia-text: #f8fafc;
  --uia-text-muted: #a3a3a3;
  --uia-border: rgba(255, 255, 255, 0.14);
  --uia-accent: #0ea5e9;
  --uia-pin: #f97316;
  --uia-multi: #22c55e;
  --uia-area: #8b5cf6;
  --uia-danger: #ef4444;
  --uia-shadow: 0 18px 60px rgba(0, 0, 0, 0.24), 0 4px 18px rgba(0, 0, 0, 0.2);
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:host([data-theme="light"]) {
  --uia-bg: #ffffff;
  --uia-bg-soft: #f4f4f5;
  --uia-text: #18181b;
  --uia-text-muted: #71717a;
  --uia-border: rgba(24, 24, 27, 0.14);
  --uia-shadow: 0 18px 60px rgba(15, 23, 42, 0.16), 0 4px 18px rgba(15, 23, 42, 0.12);
  color-scheme: light;
}

@media (prefers-color-scheme: light) {
  :host([data-theme="system"]) {
    --uia-bg: #ffffff;
    --uia-bg-soft: #f4f4f5;
    --uia-text: #18181b;
    --uia-text-muted: #71717a;
    --uia-border: rgba(24, 24, 27, 0.14);
    --uia-shadow: 0 18px 60px rgba(15, 23, 42, 0.16), 0 4px 18px rgba(15, 23, 42, 0.12);
    color-scheme: light;
  }
}

* {
  box-sizing: border-box;
}

button,
textarea {
  font: inherit;
}

.viewport {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.toolbar {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 46px;
  padding: 6px;
  border: 1px solid var(--uia-border);
  border-radius: 23px;
  background: var(--uia-bg);
  color: var(--uia-text);
  box-shadow: var(--uia-shadow);
  pointer-events: auto;
  user-select: none;
}

.toolbar[data-position="bottom-right"] { right: 20px; bottom: 20px; }
.toolbar[data-position="bottom-left"] { left: 20px; bottom: 20px; }
.toolbar[data-position="top-right"] { right: 20px; top: 20px; }
.toolbar[data-position="top-left"] { left: 20px; top: 20px; }

.tool {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 17px;
  background: transparent;
  color: var(--uia-text-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
}

.tool:hover {
  background: var(--uia-bg-soft);
  color: var(--uia-text);
}

.tool:active {
  transform: scale(0.94);
}

.tool.active {
  background: var(--uia-accent);
  color: white;
}

.tool.danger:hover {
  background: var(--uia-danger);
  color: white;
}

.badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: var(--uia-bg-soft);
  color: var(--uia-text);
  font-size: 12px;
  line-height: 1;
}

.highlight,
.drag-rect,
.selected-highlight {
  position: fixed;
  display: none;
  border-radius: 6px;
  pointer-events: none;
}

.highlight {
  border: 2px solid var(--uia-accent);
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.highlight-label {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  max-width: 260px;
  padding: 4px 7px;
  border-radius: 6px;
  background: var(--uia-accent);
  color: white;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-rect {
  border: 1px dashed var(--uia-area);
  background: rgba(139, 92, 246, 0.09);
}

.selected-highlight {
  border: 2px solid var(--uia-multi);
  background: rgba(34, 197, 94, 0.09);
}

.pins {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.pin {
  position: fixed;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  border-radius: 999px;
  background: var(--uia-pin);
  color: white;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  line-height: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%);
}

.pin[data-target-type="multi"] { background: var(--uia-multi); }
.pin[data-target-type="area"] { background: var(--uia-area); }
.pin[data-target-type="text"] { background: var(--uia-accent); }

.pin:hover {
  transform: translate(-50%, -50%) scale(1.08);
}

.pin-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  width: 240px;
  padding: 8px 9px;
  border: 1px solid var(--uia-border);
  border-radius: 8px;
  background: var(--uia-bg);
  color: var(--uia-text);
  box-shadow: var(--uia-shadow);
  font-weight: 500;
  font-size: 12px;
  line-height: 1.35;
  text-align: left;
  transform: translateX(-50%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.pin:hover .pin-tooltip {
  opacity: 1;
}

.composer {
  position: fixed;
  width: min(340px, calc(100vw - 24px));
  border: 1px solid var(--uia-border);
  border-radius: 8px;
  background: var(--uia-bg);
  color: var(--uia-text);
  box-shadow: var(--uia-shadow);
  pointer-events: auto;
  overflow: hidden;
}

.composer-header {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--uia-border);
}

.composer-title {
  display: block;
  color: var(--uia-text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.composer-subtitle {
  display: block;
  margin-top: 3px;
  color: var(--uia-text-muted);
  font-size: 12px;
  line-height: 1.3;
}

.quote {
  margin-top: 7px;
  padding: 6px 8px;
  border-left: 3px solid var(--uia-accent);
  border-radius: 5px;
  background: var(--uia-bg-soft);
  color: var(--uia-text);
  font-size: 12px;
  line-height: 1.35;
}

.feedback {
  width: 100%;
  min-height: 104px;
  display: block;
  resize: vertical;
  border: 0;
  border-bottom: 1px solid var(--uia-border);
  outline: 0;
  padding: 11px 12px;
  background: transparent;
  color: var(--uia-text);
  font-size: 14px;
  line-height: 1.45;
}

.feedback::placeholder {
  color: var(--uia-text-muted);
}

.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-button {
  height: 30px;
  padding: 0 11px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--uia-text-muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
}

.text-button:hover {
  background: var(--uia-bg-soft);
  color: var(--uia-text);
}

.text-button.primary {
  background: var(--uia-accent);
  color: white;
}

.text-button.danger:hover {
  background: var(--uia-danger);
  color: white;
}

:host([data-enabled="true"]) .viewport {
  cursor: crosshair;
}
`;

  // src/overlay.ts
  var ICONS = {
    cursor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 3l12 8-5 2 3 6-2.5 1.2-3-6-4 4V3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5l11 7-11 7V5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" stroke="currentColor" stroke-width="1.8"/></svg>',
    eyeOff: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M9.8 5.4A9.3 9.3 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-2.1 2.8M6.2 6.8C3.8 8.6 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    copy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function truncate(value, max = 120) {
    return value.length > max ? `${value.slice(0, max - 3)}...` : value;
  }
  var OverlayRenderer = class {
    constructor(labels, callbacks) {
      this.callbacks = callbacks;
      this.host = null;
      this.shadow = null;
      this.currentComposerKey = null;
      this.handleShadowClick = (event) => {
        const target = event.target;
        const actionTarget = target?.closest("[data-action]");
        const markerTarget = target?.closest("[data-marker-id]");
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
            const textarea = this.shadow?.querySelector(".feedback");
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
      this.handleShadowContextMenu = (event) => {
        const target = event.target;
        const markerTarget = target?.closest("[data-marker-id]");
        if (!markerTarget?.dataset.markerId) return;
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onMarkerDelete(markerTarget.dataset.markerId);
      };
      this.labels = mergeLabels(labels);
    }
    mount(zIndex) {
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
    unmount() {
      this.shadow?.removeEventListener("click", this.handleShadowClick);
      this.shadow?.removeEventListener("contextmenu", this.handleShadowContextMenu);
      this.host?.remove();
      this.host = null;
      this.shadow = null;
      this.currentComposerKey = null;
    }
    getHost() {
      return this.host;
    }
    render(state) {
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
    renderToolbar(state) {
      const toolbar = this.shadow?.querySelector(".toolbar");
      if (!toolbar) return;
      toolbar.dataset.position = state.position;
      toolbar.innerHTML = `
      <button class="tool ${state.enabled ? "active" : ""}" type="button" data-action="toggle" aria-label="${state.enabled ? this.labels.annotateOff : this.labels.annotateOn}" aria-pressed="${state.enabled}" title="${state.enabled ? this.labels.annotateOff : this.labels.annotateOn}">${ICONS.cursor}</button>
      <button class="tool ${state.frozen ? "active" : ""}" type="button" data-action="freeze" aria-label="${state.frozen ? this.labels.freezeOff : this.labels.freezeOn}" aria-pressed="${state.frozen}" title="${state.frozen ? this.labels.freezeOff : this.labels.freezeOn}">${state.frozen ? ICONS.play : ICONS.pause}</button>
      <button class="tool" type="button" data-action="markers" aria-label="${state.showMarkers ? this.labels.hideMarkers : this.labels.showMarkers}" aria-pressed="${state.showMarkers}" title="${state.showMarkers ? this.labels.hideMarkers : this.labels.showMarkers}">${state.showMarkers ? ICONS.eye : ICONS.eyeOff}</button>
      <button class="tool" type="button" data-action="copy" aria-label="${this.labels.copy}" title="${this.labels.copy}">${ICONS.copy}</button>
      <button class="tool danger" type="button" data-action="clear" aria-label="${this.labels.clear}" title="${this.labels.clear}">${ICONS.trash}</button>
      <span class="badge" aria-live="polite">${state.annotations.length}</span>
    `;
    }
    renderHover(hover) {
      const highlight = this.shadow?.querySelector(".highlight");
      const label = this.shadow?.querySelector(".highlight-label");
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
    renderDrag(dragRect, selectedRects = []) {
      const drag = this.shadow?.querySelector(".drag-rect");
      const selectedRoot = this.shadow?.querySelector(".selected-rects");
      if (!drag || !selectedRoot) return;
      if (dragRect) {
        drag.style.display = "block";
        drag.style.transform = `translate(${dragRect.x}px, ${dragRect.y}px)`;
        drag.style.width = `${dragRect.width}px`;
        drag.style.height = `${dragRect.height}px`;
      } else {
        drag.style.display = "none";
      }
      selectedRoot.innerHTML = selectedRects.map(
        (rect) => `<div class="selected-highlight" style="display:block;transform:translate(${rect.x}px, ${rect.y}px);width:${rect.width}px;height:${rect.height}px"></div>`
      ).join("");
    }
    renderPins(views, showMarkers) {
      const pins = this.shadow?.querySelector(".pins");
      if (!pins) return;
      if (!showMarkers) {
        pins.innerHTML = "";
        return;
      }
      pins.innerHTML = views.map(({ annotation, viewportRect }) => {
        const centerX = viewportRect.x + viewportRect.width / 2;
        const y = annotation.targetType === "element" || annotation.targetType === "text" ? viewportRect.y : viewportRect.y + viewportRect.height / 2;
        const note = truncate(annotation.feedback, 140);
        return `
          <button class="pin" type="button" data-marker-id="${annotation.id}" data-target-type="${annotation.targetType}" aria-label="Annotation ${annotation.number}" style="left:${centerX}px;top:${y}px">
            ${annotation.number}
            <span class="pin-tooltip">${escapeHtml(note)}</span>
          </button>
        `;
      }).join("");
    }
    renderComposer(composer) {
      const root = this.shadow?.querySelector(".composer-root");
      if (!root) return;
      if (!composer) {
        root.innerHTML = "";
        this.currentComposerKey = null;
        return;
      }
      const left = clamp(composer.position.x + 14, 12, window.innerWidth - 352);
      const top = composer.position.y > window.innerHeight - 260 ? clamp(composer.position.y - 230, 12, window.innerHeight - 230) : clamp(composer.position.y + 14, 12, window.innerHeight - 230);
      if (this.currentComposerKey === composer.key) {
        const popup = root.querySelector(".composer");
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
          ${composer.subtitle ? `<span class="composer-subtitle">${escapeHtml(composer.subtitle)}</span>` : ""}
          ${composer.selectedText ? `<div class="quote"><strong>${escapeHtml(
        this.labels.selectedTextLabel
      )}:</strong> ${escapeHtml(truncate(composer.selectedText, 150))}</div>` : ""}
        </div>
        <textarea class="feedback" placeholder="${escapeHtml(
        isEdit ? this.labels.editFeedbackPlaceholder : this.labels.feedbackPlaceholder
      )}">${escapeHtml(composer.initialFeedback ?? "")}</textarea>
        <div class="composer-actions">
          <div class="action-group">
            ${isEdit ? `<button class="text-button danger" type="button" data-action="composer-delete">${this.labels.delete}</button>` : ""}
          </div>
          <div class="action-group">
            <button class="text-button" type="button" data-action="composer-cancel">${this.labels.cancel}</button>
            <button class="text-button primary" type="button" data-action="composer-submit">${isEdit ? this.labels.save : this.labels.add}</button>
          </div>
        </div>
      </div>
    `;
      queueMicrotask(() => {
        const textarea = this.shadow?.querySelector(".feedback");
        textarea?.focus();
        if (textarea) textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      });
    }
  };

  // src/state.ts
  function cloneAnnotation(annotation) {
    return {
      ...annotation,
      classList: annotation.classList ? [...annotation.classList] : void 0,
      rect: { ...annotation.rect }
    };
  }
  function renumber(annotations) {
    return annotations.map((annotation, index) => ({
      ...annotation,
      number: index + 1
    }));
  }
  var AnnotationState = class {
    constructor(initialAnnotations = []) {
      this.annotations = renumber(initialAnnotations.map(cloneAnnotation));
    }
    getAll() {
      return this.annotations.map(cloneAnnotation);
    }
    setAll(annotations) {
      this.annotations = renumber(annotations.map(cloneAnnotation));
      return this.getAll();
    }
    add(annotation) {
      this.annotations = renumber([...this.annotations, cloneAnnotation(annotation)]);
      return this.getAll();
    }
    update(id, patch) {
      this.annotations = renumber(
        this.annotations.map(
          (annotation) => annotation.id === id ? { ...annotation, ...patch, id: annotation.id } : annotation
        )
      );
      return this.getAll();
    }
    delete(id) {
      this.annotations = renumber(this.annotations.filter((annotation) => annotation.id !== id));
      return this.getAll();
    }
    clear() {
      this.annotations = [];
      return [];
    }
  };

  // src/storage.ts
  function emptyStore() {
    return { version: 1, groups: {} };
  }
  function getLocalStorage() {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
  function readStore(storageKey) {
    const storage = getLocalStorage();
    if (!storage) return emptyStore();
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return emptyStore();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { version: 1, groups: { default: parsed } };
      }
      return {
        version: 1,
        groups: parsed.groups && typeof parsed.groups === "object" ? parsed.groups : {}
      };
    } catch {
      return emptyStore();
    }
  }
  function writeStore(storageKey, store) {
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(storageKey, JSON.stringify(store));
    } catch {
    }
  }
  function getStorageGroup(path, sessionId = "local") {
    return `${sessionId}:${path}`;
  }
  function loadAnnotations(storageKey, group) {
    return readStore(storageKey).groups[group] ?? [];
  }
  function saveAnnotations(storageKey, group, annotations) {
    const store = readStore(storageKey);
    if (annotations.length === 0) {
      delete store.groups[group];
    } else {
      store.groups[group] = annotations;
    }
    writeStore(storageKey, store);
  }
  function clearAnnotations(storageKey, group) {
    saveAnnotations(storageKey, group, []);
  }

  // src/annotator.ts
  var DEFAULT_STORAGE_KEY = "ui-annotations";
  var DEFAULT_Z_INDEX = 2147483e3;
  var idCounter = 0;
  function createId() {
    idCounter += 1;
    return `ann_${Date.now().toString(36)}_${idCounter.toString(36)}`;
  }
  function cloneAnnotations(annotations) {
    return annotations.map((annotation) => ({
      ...annotation,
      classList: annotation.classList ? [...annotation.classList] : void 0,
      rect: { ...annotation.rect }
    }));
  }
  function getCurrentPath(options) {
    return options.pageId || getPagePath();
  }
  function getViewportRectForAnnotation(annotation) {
    if (annotation.targetType === "area") return documentToViewportRect(annotation.rect);
    try {
      if (annotation.targetType === "multi") {
        const selectors = splitSelectorList(annotation.selector);
        const elements = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))).filter(Boolean);
        const bounds = getBoundsForElements(elements);
        if (bounds) return documentToViewportRect(bounds);
      } else {
        const element = document.querySelector(annotation.selector);
        if (element) return documentToViewportRect(inspectElement(element).rect);
      }
    } catch {
    }
    return documentToViewportRect(annotation.rect);
  }
  function getAnnotationTitle(annotation) {
    if (annotation.accessibleName) return annotation.accessibleName;
    if (annotation.textSnippet) return annotation.textSnippet;
    if (annotation.tagName) return annotation.tagName;
    return annotation.targetType;
  }
  function getDraftTitle(draft) {
    if (draft.targetType === "area") return "Area selection";
    if (draft.targetType === "multi") return `${draft.classList?.length ?? 0} element selection`;
    return draft.accessibleName || draft.textSnippet || draft.tagName || draft.targetType;
  }
  function pointForRect(rect) {
    const viewport = documentToViewportRect(rect);
    return {
      x: viewport.x + viewport.width / 2,
      y: viewport.y + Math.min(viewport.height / 2, 24)
    };
  }
  var UIAnnotator = class {
    constructor(options = {}) {
      this.options = options;
      this.mounted = false;
      this.enabled = false;
      this.showMarkers = true;
      this.state = new AnnotationState();
      this.draft = null;
      this.editing = null;
      this.selectedRects = [];
      this.multiSelection = [];
      this.handleViewportChange = () => {
        if (this.mounted) this.render();
      };
      this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
      this.pagePath = getCurrentPath(options);
      this.storageGroup = getStorageGroup(this.pagePath, options.sessionId);
      this.enabled = !!options.enabled;
      this.overlay = new OverlayRenderer(options.labels, {
        onToggleEnabled: () => this.enabled ? this.disable() : this.enable(),
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
        }
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
        onEscape: () => this.handleEscape()
      });
    }
    mount() {
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
    unmount() {
      if (!this.mounted) return;
      this.disable();
      this.events.destroy();
      this.overlay.unmount();
      window.removeEventListener("scroll", this.handleViewportChange, true);
      window.removeEventListener("resize", this.handleViewportChange);
      this.mounted = false;
    }
    enable() {
      this.enabled = true;
      this.render();
    }
    disable() {
      this.enabled = false;
      this.draft = null;
      this.editing = null;
      this.hover = void 0;
      this.dragRect = void 0;
      this.selectedRects = [];
      this.multiSelection = [];
      if (isFrozen()) unfreezeAnimations();
      this.render();
    }
    clear() {
      this.state.clear();
      this.draft = null;
      this.editing = null;
      this.persist();
      this.render();
    }
    getAnnotations() {
      return this.state.getAll();
    }
    async copyMarkdown() {
      const annotations = this.state.getAll();
      const markdown = formatMarkdown(annotations, this.pagePath, getPageUrl());
      if (markdown && this.options.copyToClipboard !== false) {
        try {
          await navigator.clipboard?.writeText(markdown);
        } catch {
        }
      }
      this.options.onCopy?.(markdown);
      return markdown;
    }
    get position() {
      return this.options.position || "bottom-right";
    }
    get theme() {
      return this.options.theme || "system";
    }
    persist() {
      const annotations = this.state.getAll();
      saveAnnotations(this.storageKey, this.storageGroup, annotations);
      this.options.onChange?.(cloneAnnotations(annotations));
    }
    render() {
      if (!this.mounted) return;
      const annotations = this.state.getAll();
      const views = annotations.map((annotation) => ({
        annotation,
        viewportRect: getViewportRectForAnnotation(annotation)
      }));
      const composer = this.draft ? {
        key: this.draft.key,
        mode: "add",
        title: getDraftTitle(this.draft),
        subtitle: this.draft.selector,
        selectedText: this.draft.targetType === "text" ? this.draft.textSnippet : void 0,
        initialFeedback: this.draft.feedback,
        position: this.draft.point,
        targetType: this.draft.targetType
      } : this.editing ? {
        key: `edit:${this.editing.id}`,
        mode: "edit",
        title: getAnnotationTitle(this.editing),
        subtitle: this.editing.selector,
        selectedText: this.editing.targetType === "text" ? this.editing.textSnippet : void 0,
        initialFeedback: this.editing.feedback,
        position: pointForRect(this.editing.rect),
        targetType: this.editing.targetType
      } : void 0;
      this.overlay.render({
        enabled: this.enabled,
        frozen: isFrozen(),
        showMarkers: this.showMarkers,
        position: this.position,
        theme: this.theme,
        zIndex: this.options.zIndex ?? DEFAULT_Z_INDEX,
        annotations: views,
        hover: this.enabled && !composer ? this.hover : void 0,
        dragRect: this.dragRect,
        selectedRects: this.selectedRects,
        composer
      });
    }
    setHover(element) {
      if (!this.enabled || this.draft || this.editing) return;
      if (element.closest("[data-ui-annotator-host]")) return;
      const inspection = inspectElement(element, getSelectionText());
      this.hover = {
        rect: documentToViewportRect(inspection.rect),
        label: inspection.accessibleName || inspection.textSnippet || inspection.selector
      };
      this.render();
    }
    clearHover() {
      if (!this.hover) return;
      this.hover = void 0;
      this.render();
    }
    createElementDraft(element) {
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
          y: rect.y + Math.min(rect.height / 2, 24)
        }
      };
      this.hover = void 0;
      this.render();
    }
    updateDragPreview(rect, elements) {
      this.dragRect = rect;
      this.selectedRects = elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          x: box.left,
          y: box.top,
          width: box.width,
          height: box.height
        };
      });
      this.render();
    }
    createDragDraft(rect, elements) {
      this.dragRect = void 0;
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
          textSnippet: elements.length === 1 ? first.textSnippet : `${elements.length} selected elements`,
          point: {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          }
        };
      } else if (rect.width >= 20 && rect.height >= 20) {
        const docRect = viewportToDocumentRect(rect);
        this.draft = {
          key: createId(),
          targetType: "area",
          url: getPageUrl(),
          path: this.pagePath,
          selector: `area(${Math.round(docRect.x)},${Math.round(docRect.y)},${Math.round(
            docRect.width
          )},${Math.round(docRect.height)})`,
          rect: docRect,
          point: {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          }
        };
      }
      this.render();
    }
    toggleMultiSelection(element) {
      const index = this.multiSelection.indexOf(element);
      if (index >= 0) this.multiSelection.splice(index, 1);
      else this.multiSelection.push(element);
      this.selectedRects = this.multiSelection.map((selected) => {
        const rect = selected.getBoundingClientRect();
        return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      });
      this.render();
    }
    commitMultiSelection() {
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
          this.selectedRects[0]
        ),
        this.multiSelection
      );
      this.multiSelection = [];
    }
    submitComposer(feedback) {
      if (this.draft) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const annotation = {
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
          updatedAt: now
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
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.editing = null;
        this.persist();
        this.render();
      }
    }
    cancelComposer() {
      this.draft = null;
      this.editing = null;
      this.dragRect = void 0;
      this.selectedRects = [];
      this.render();
    }
    startEdit(id) {
      const annotation = this.state.getAll().find((item) => item.id === id);
      if (!annotation) return;
      this.editing = annotation;
      this.draft = null;
      this.render();
    }
    deleteAnnotation(id) {
      this.state.delete(id);
      if (this.editing?.id === id) this.editing = null;
      this.persist();
      this.render();
    }
    toggleFrozen() {
      if (isFrozen()) unfreezeAnimations();
      else freezeAnimations();
      this.render();
    }
    handleEscape() {
      if (this.draft || this.editing || this.multiSelection.length > 0) {
        this.cancelComposer();
        this.multiSelection = [];
        return;
      }
      this.disable();
    }
  };
  function createAnnotator(options = {}) {
    return new UIAnnotator(options);
  }
  return __toCommonJS(src_exports);
})();
globalThis.UIAnnotator = globalThis.AgentationVanilla;
//# sourceMappingURL=agentation-vanilla.global.js.map