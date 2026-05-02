import { describe, expect, it } from "vitest";
import { getStorageGroup, loadAnnotations, saveAnnotations } from "../src/storage";
import type { Annotation } from "../src/types";

const annotation: Annotation = {
  id: "a1",
  number: 1,
  url: "http://localhost/page",
  path: "/page",
  selector: "#target",
  targetType: "element",
  feedback: "Change this",
  rect: { x: 1, y: 2, width: 3, height: 4 },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("storage", () => {
  it("persists annotations by page and session group", () => {
    const group = getStorageGroup("/page", "session-1");
    saveAnnotations("ui-test", group, [annotation]);
    expect(loadAnnotations("ui-test", group)).toEqual([annotation]);
    expect(loadAnnotations("ui-test", getStorageGroup("/other", "session-1"))).toEqual([]);
  });
});
