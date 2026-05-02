type AnnotationTargetType = "element" | "text" | "area" | "multi";
type AnnotatorPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
type AnnotatorTheme = "system" | "light" | "dark";
type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
type Annotation = {
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
type AnnotatorLabels = {
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
type CreateAnnotatorOptions = {
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
type Annotator = {
    mount(): Annotator;
    unmount(): void;
    enable(): void;
    disable(): void;
    clear(): void;
    getAnnotations(): Annotation[];
    copyMarkdown(): Promise<string>;
};
type ElementInspection = {
    selector: string;
    path: string;
    tagName?: string;
    idAttribute?: string;
    classList?: string[];
    textSnippet?: string;
    accessibleName?: string;
    rect: Rect;
};

declare class UIAnnotator implements Annotator {
    private options;
    private mounted;
    private enabled;
    private showMarkers;
    private state;
    private overlay;
    private events;
    private draft;
    private editing;
    private hover;
    private dragRect;
    private selectedRects;
    private multiSelection;
    private storageKey;
    private storageGroup;
    private pagePath;
    constructor(options?: CreateAnnotatorOptions);
    mount(): Annotator;
    unmount(): void;
    enable(): void;
    disable(): void;
    clear(): void;
    getAnnotations(): Annotation[];
    copyMarkdown(): Promise<string>;
    private handleViewportChange;
    private get position();
    private get theme();
    private persist;
    private render;
    private setHover;
    private clearHover;
    private createElementDraft;
    private updateDragPreview;
    private createDragDraft;
    private toggleMultiSelection;
    private commitMultiSelection;
    private submitComposer;
    private cancelComposer;
    private startEdit;
    private deleteAnnotation;
    private toggleFrozen;
    private handleEscape;
}
declare function createAnnotator(options?: CreateAnnotatorOptions): Annotator;

declare function formatMarkdown(annotations: Annotation[], pagePath: string, pageUrl?: string): string;

declare function generateSelector(element: Element): string;

declare function getStorageGroup(path: string, sessionId?: string): string;
declare function loadAnnotations(storageKey: string, group: string): Annotation[];
declare function saveAnnotations(storageKey: string, group: string, annotations: Annotation[]): void;
declare function clearAnnotations(storageKey: string, group: string): void;

export { type Annotation, type AnnotationTargetType, type Annotator, type AnnotatorLabels, type AnnotatorPosition, type AnnotatorTheme, type CreateAnnotatorOptions, type ElementInspection, type Rect, UIAnnotator, clearAnnotations, createAnnotator, formatMarkdown, generateSelector, getStorageGroup, loadAnnotations, saveAnnotations };
