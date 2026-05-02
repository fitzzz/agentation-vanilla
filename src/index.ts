export { createAnnotator, UIAnnotator } from "./annotator";
export { formatMarkdown } from "./markdown";
export { generateSelector } from "./selector";
export {
  clearAnnotations,
  getStorageGroup,
  loadAnnotations,
  saveAnnotations,
} from "./storage";
export type {
  Annotation,
  AnnotationTargetType,
  Annotator,
  AnnotatorLabels,
  AnnotatorPosition,
  AnnotatorTheme,
  CreateAnnotatorOptions,
  ElementInspection,
  Rect,
} from "./types";
