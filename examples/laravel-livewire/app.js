import { createAnnotator } from "agentation-vanilla";

if (import.meta.env.DEV) {
  createAnnotator({
    enabled: true,
    storageKey: "my-app-ui-annotations",
    position: "bottom-right",
    theme: "system",
    sessionId: "local-dev",
  }).mount();
}
