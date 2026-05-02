Build a framework-agnostic, non-React UI-layer port inspired by the Agentation project:

Reference repo:
https://github.com/benjitaylor/agentation

Primary goal:
Create a new package that works like Agentation's browser UI layer, but without React, without MCP, and without backend requirements. It should provide the same core annotation experience for plain HTML, Laravel Blade, Livewire, Alpine, Rails, Django, static sites, etc.

Important:
- Inspect https://github.com/benjitaylor/agentation first.
- Study its README, package structure, UI behavior, toolbar flow, annotation model, selector generation, storage behavior, markdown output, and visual interaction patterns.
- Do not blindly copy source code unless the license implications are understood and intentionally accepted.
- Prefer a clean TypeScript implementation that matches the observable UI/UX and public behavior.
- Note that upstream Agentation is licensed under PolyForm Shield 1.0.0.
- This new package should not depend on React, React DOM, MCP, Livewire, Vue, Svelte, or any framework.

Scope:
Build only the browser UI annotation parts:
- Floating bottom-right toolbar.
- Annotation mode toggle.
- Element hover highlighting.
- Click element to annotate.
- Text selection annotation if practical.
- Multi-element drag selection if practical.
- Area selection if practical.
- Animation pause/freeze toggle if practical.
- Composer popup for feedback.
- Numbered annotation pins.
- Reopen/edit/delete annotations.
- Clear all annotations.
- Copy structured markdown.
- Local-first storage in localStorage.
- Per-page/session annotation grouping.

Do not implement:
- MCP server.
- Agent sync.
- Webhooks.
- Backend storage.
- React component wrapper.

Public API:
```ts
import { createAnnotator } from '@YOUR_SCOPE/ui-annotator';

const annotator = createAnnotator({
  enabled: true,
  storageKey: 'ui-annotations',
  position: 'bottom-right',
  theme: 'system',
});

annotator.mount();
annotator.unmount();
annotator.enable();
annotator.disable();
annotator.clear();
annotator.getAnnotations();
annotator.copyMarkdown();
```

Also support browser global usage:
```html
<script src="/dist/ui-annotator.global.js"></script>
<script>
  window.UIAnnotator.createAnnotator({ enabled: true }).mount();
</script>
```

Architecture:
- Vanilla TypeScript.
- No runtime framework.
- Separate modules for:
  - DOM inspection / element identification
  - selector generation
  - annotation state
  - localStorage persistence
  - markdown formatting
  - overlay rendering
  - event handling
  - animation pause behavior
- Prefer Shadow DOM for the overlay UI to avoid CSS collisions.
- Keep user-page event interference minimal.
- When annotation mode is off, the app should behave normally.
- When annotation mode is on, selected clicks should not trigger underlying app actions.
- Use high z-index with configurable override.
- Keep labels/strings centralized.

Annotation shape should include:
```ts
type Annotation = {
  id: string;
  number: number;
  url: string;
  path: string;
  selector: string;
  targetType: 'element' | 'text' | 'area' | 'multi';
  feedback: string;
  tagName?: string;
  idAttribute?: string;
  classList?: string[];
  textSnippet?: string;
  accessibleName?: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
};
```

Selector strategy:
Prefer stable selectors in this order:
1. id
2. data-testid / data-test / data-cy
3. aria-label
4. meaningful class path
5. structural nth-of-type fallback

Markdown output:
- Match Agentation's usefulness for AI coding agents.
- Include annotation number, feedback, selector, page path, element metadata, nearby text/snippet, and rect.
- Make output easy to paste into Codex/Claude/Cursor.

Package setup:
- Use TypeScript.
- Use tsup or Vite library mode.
- Emit:
  - ESM build
  - CJS build if easy
  - browser global/IIFE build
  - `.d.ts` types
- Add tests with Vitest or equivalent.
- Add examples:
  - plain HTML
  - Laravel Blade/Livewire with Vite dev-only mounting
  - optional Alpine example, but Alpine must not be required

Tests:
Add coverage for:
- mount/unmount lifecycle
- enable/disable behavior
- selector generation
- localStorage persistence
- markdown formatting
- creating/deleting/clearing annotations
- click interception while annotation mode is active

README:
Include:
- What this package is
- How it differs from Agentation
- Attribution/reference to https://github.com/benjitaylor/agentation
- License notes
- Install instructions
- ESM usage
- browser global usage
- Laravel Livewire usage
- development-only recommendation

Deliverables:
1. Working package source.
2. Build scripts.
3. Tests.
4. Examples.
5. README.
6. A short implementation summary.
7. Exact commands run and their results.

Start by inspecting the upstream Agentation repository and summarizing the UI behaviors and files that matter, then implement the clean non-React package.
