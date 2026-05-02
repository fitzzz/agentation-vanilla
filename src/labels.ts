import type { AnnotatorLabels } from "./types";

export const DEFAULT_LABELS: AnnotatorLabels = {
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
  selectedTextLabel: "Selected text",
};

export function mergeLabels(labels?: Partial<AnnotatorLabels>): AnnotatorLabels {
  return { ...DEFAULT_LABELS, ...labels };
}
