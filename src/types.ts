export type AnnotationTargetType = "element" | "text" | "area" | "multi";

export type AnnotatorPosition =
  | "bottom-right"
  | "bottom-center"
  | "bottom-left"
  | "top-right"
  | "top-center"
  | "top-left";

export type AnnotatorTheme = "system" | "light" | "dark";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Annotation = {
  id: string;
  number: number;
  url: string;
  path: string;
  selector: string;
  targetType: AnnotationTargetType;
  feedback: string;
  tagName?: string;
  idAttribute?: string;
  classList?: string[];
  textSnippet?: string;
  accessibleName?: string;
  rect: Rect;
  createdAt: string;
  updatedAt: string;
};

export type AnnotatorLabels = {
  annotateOn: string;
  annotateOff: string;
  freezeOn: string;
  freezeOff: string;
  showMarkers: string;
  hideMarkers: string;
  copy: string;
  clear: string;
  cancel: string;
  delete: string;
  add: string;
  save: string;
  feedbackPlaceholder: string;
  editFeedbackPlaceholder: string;
  selectedTextLabel: string;
};

export type CreateAnnotatorOptions = {
  enabled?: boolean;
  storageKey?: string;
  position?: AnnotatorPosition;
  theme?: AnnotatorTheme;
  zIndex?: number;
  sessionId?: string;
  pageId?: string;
  copyToClipboard?: boolean;
  labels?: Partial<AnnotatorLabels>;
  onChange?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
};

export type Annotator = {
  mount(): Annotator;
  unmount(): void;
  enable(): void;
  disable(): void;
  clear(): void;
  getAnnotations(): Annotation[];
  copyMarkdown(): Promise<string>;
};

export type ElementInspection = {
  selector: string;
  path: string;
  tagName?: string;
  idAttribute?: string;
  classList?: string[];
  textSnippet?: string;
  accessibleName?: string;
  rect: Rect;
};
