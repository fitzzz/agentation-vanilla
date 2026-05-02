import { createAnnotator } from "agentation-vanilla";

if (import.meta.env.DEV) {
  createAnnotator({
    enabled: true,
    storageKey: "my-app-ui-annotations",
    position: "bottom-center",
    theme: "system",
    sessionId: "local-dev",
  }).mount();
}
