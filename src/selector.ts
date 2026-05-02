const DATA_ATTRIBUTES = ["data-testid", "data-test", "data-cy"];

function getDocument(element: Element): Document {
  return element.ownerDocument || document;
}

export function cssEscape(value: string): string {
  const nativeEscape = globalThis.CSS?.escape;
  if (nativeEscape) return nativeEscape(value);

  return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (match, digit) => {
    if (digit) return `\\3${digit} `;
    return `\\${match}`;
  });
}

function attrEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isUnique(element: Element, selector: string): boolean {
  try {
    const matches = getDocument(element).querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch {
    return false;
  }
}

function isUniqueSelector(element: Element, selector: string): boolean {
  try {
    return getDocument(element).querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function isMeaningfulClass(className: string): boolean {
  if (className.length < 3) return false;
  if (/^[a-z]{1,2}$/.test(className)) return false;
  if (/^[a-f0-9]{6,}$/i.test(className)) return false;
  if (/[A-Za-z0-9_-]*__[A-Za-z0-9_-]*___[A-Za-z0-9_-]+/.test(className)) {
    return false;
  }
  if (/^[A-Za-z]+_[A-Za-z0-9_-]{5,}$/.test(className)) return false;
  return true;
}

function classSelector(element: Element): string | null {
  const meaningful = Array.from(element.classList)
    .filter(isMeaningfulClass)
    .slice(0, 2);
  if (meaningful.length === 0) return null;
  const tag = element.tagName.toLowerCase();
  return `${tag}.${meaningful.map(cssEscape).join(".")}`;
}

function nthOfTypeSelector(element: Element): string {
  const tag = element.tagName.toLowerCase();
  let index = 1;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) index += 1;
    sibling = sibling.previousElementSibling;
  }
  return `${tag}:nth-of-type(${index})`;
}

function stableSegment(element: Element): string {
  const classPart = classSelector(element);
  return classPart || nthOfTypeSelector(element);
}

export function generateSelector(element: Element): string {
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

  const path: string[] = [];
  let current: Element | null = element;
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
      const selector = path.join(" > ");
      if (isUniqueSelector(element, selector)) return selector;
      break;
    }

    path.unshift(stableSegment(current));
    const selector = path.join(" > ");
    if (isUnique(element, selector)) return selector;
    current = current.parentElement;
  }

  return path.join(" > ") || element.tagName.toLowerCase();
}

export function splitSelectorList(selector: string): string[] {
  return selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
