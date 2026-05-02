# agentation-vanilla

A framework-agnostic browser UI annotation layer for AI coding feedback. It adds a floating toolbar to any page, lets you mark elements or regions, stores annotations locally, and exports structured markdown that is easy to paste into Codex, Claude, Cursor, or another coding agent.

Inspired by [Agentation](https://github.com/benjitaylor/agentation), but implemented as a framework-agnostic TypeScript library that ships plain browser JavaScript and has no React dependency.

It does not include MCP, webhooks, agent sync, or backend storage.

## Features

- Floating bottom-right toolbar, with other corner positions supported.
- Annotation mode toggle.
- Element hover highlighting.
- Click-to-annotate with selected text capture.
- Drag selection for multiple meaningful elements.
- Area selection when a drag does not capture elements.
- Animation pause toggle for CSS animations, WAAPI animations, and videos.
- Shadow DOM overlay UI to reduce host CSS collisions.
- Numbered annotation pins.
- Reopen, edit, delete, and clear annotations.
- Structured markdown copy.
- Local-first localStorage persistence grouped by page and optional session id.
- ESM, CJS, browser global, and TypeScript declaration builds.

## Install

```bash
npm install agentation-vanilla -D
```

Use it in development and design review environments. The package is local-only, but annotation mode intentionally intercepts page clicks while active.

## ESM Usage

```ts
import { createAnnotator } from "agentation-vanilla";

const annotator = createAnnotator({
  enabled: true,
  storageKey: "ui-annotations",
  position: "bottom-right",
  theme: "system",
});

annotator.mount();

// Available API:
annotator.enable();
annotator.disable();
annotator.clear();
annotator.getAnnotations();
await annotator.copyMarkdown();
annotator.unmount();
```

## Browser Global Usage

```html
<script src="/dist/agentation-vanilla.global.js"></script>
<script>
  window.AgentationVanilla.createAnnotator({ enabled: true }).mount();
</script>
```

## Laravel Livewire Usage

Mount only in Vite dev builds:

```ts
import { createAnnotator } from "agentation-vanilla";

if (import.meta.env.DEV) {
  createAnnotator({
    enabled: true,
    storageKey: "my-app-ui-annotations",
    sessionId: "local-dev",
  }).mount();
}
```

Then include the normal Vite entry from Blade:

```blade
@vite(['resources/css/app.css', 'resources/js/app.js'])
@livewireStyles
{{ $slot }}
@livewireScripts
```

## API

```ts
type Annotation = {
  id: string;
  number: number;
  url: string;
  path: string;
  selector: string;
  targetType: "element" | "text" | "area" | "multi";
  feedback: string;
  tagName?: string;
  idAttribute?: string;
  classList?: string[];
  textSnippet?: string;
  accessibleName?: string;
  rect: { x: number; y: number; width: number; height: number };
  createdAt: string;
  updatedAt: string;
};
```

`createAnnotator` options:

- `enabled`: start in annotation mode.
- `storageKey`: localStorage key. Default: `ui-annotations`.
- `position`: `bottom-right`, `bottom-left`, `top-right`, or `top-left`.
- `theme`: `system`, `light`, or `dark`.
- `zIndex`: overlay z-index override.
- `sessionId`: optional local grouping id.
- `pageId`: optional page grouping override.
- `copyToClipboard`: set `false` to only return markdown.
- `labels`: override centralized UI strings.
- `onChange`: receive annotations after local changes.
- `onCopy`: receive markdown after copy.

## Selector Strategy

Selectors prefer stable targets in this order:

1. Unique `id`.
2. Unique `data-testid`, `data-test`, or `data-cy`.
3. Unique `aria-label`.
4. Meaningful class path.
5. `nth-of-type` structural fallback.

## Examples

- `examples/plain-html/index.html`
- `examples/laravel-livewire/app.js`
- `examples/laravel-livewire/example.blade.php`
- `examples/alpine/index.html`

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```
