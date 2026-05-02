import type { Annotation } from "./types";

type StoredAnnotations = {
  version: 1;
  groups: Record<string, Annotation[]>;
};

function emptyStore(): StoredAnnotations {
  return { version: 1, groups: {} };
}

function getLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readStore(storageKey: string): StoredAnnotations {
  const storage = getLocalStorage();
  if (!storage) return emptyStore();
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<StoredAnnotations> | Annotation[];
    if (Array.isArray(parsed)) {
      return { version: 1, groups: { default: parsed } };
    }
    return {
      version: 1,
      groups: parsed.groups && typeof parsed.groups === "object" ? parsed.groups : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(storageKey: string, store: StoredAnnotations): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey, JSON.stringify(store));
  } catch {
    // localStorage can be disabled or full.
  }
}

export function getStorageGroup(path: string, sessionId = "local"): string {
  return `${sessionId}:${path}`;
}

export function loadAnnotations(storageKey: string, group: string): Annotation[] {
  return readStore(storageKey).groups[group] ?? [];
}

export function saveAnnotations(
  storageKey: string,
  group: string,
  annotations: Annotation[],
): void {
  const store = readStore(storageKey);
  if (annotations.length === 0) {
    delete store.groups[group];
  } else {
    store.groups[group] = annotations;
  }
  writeStore(storageKey, store);
}

export function clearAnnotations(storageKey: string, group: string): void {
  saveAnnotations(storageKey, group, []);
}
