export const OVERLAY_CSS = `
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
