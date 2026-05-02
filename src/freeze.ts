const STYLE_ID = "ui-annotator-freeze-style";
const PAUSED_VIDEO_ATTR = "data-ui-annotator-was-playing";

let frozen = false;
let pausedAnimations: Animation[] = [];

function isOverlayElement(element: Element | null): boolean {
  return !!element?.closest("[data-ui-annotator-host]");
}

export function freezeAnimations(): void {
  if (typeof document === "undefined" || frozen) return;
  frozen = true;

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
  }
  style.textContent = `
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *),
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *)::before,
    *:not([data-ui-annotator-host]):not([data-ui-annotator-host] *)::after {
      animation-play-state: paused !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `;
  document.head.appendChild(style);

  pausedAnimations = [];
  try {
    for (const animation of document.getAnimations()) {
      const target = (animation.effect as KeyframeEffect | null)?.target as Element | null;
      if (animation.playState === "running" && !isOverlayElement(target)) {
        animation.pause();
        pausedAnimations.push(animation);
      }
    }
  } catch {
    pausedAnimations = [];
  }

  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) {
      video.setAttribute(PAUSED_VIDEO_ATTR, "true");
      video.pause();
    }
  });
}

export function unfreezeAnimations(): void {
  if (typeof document === "undefined" || !frozen) return;
  frozen = false;

  document.getElementById(STYLE_ID)?.remove();

  for (const animation of pausedAnimations) {
    try {
      animation.play();
    } catch {
      // The animation may have been detached from the document.
    }
  }
  pausedAnimations = [];

  document.querySelectorAll<HTMLVideoElement>(`video[${PAUSED_VIDEO_ATTR}]`).forEach((video) => {
    video.removeAttribute(PAUSED_VIDEO_ATTR);
    void video.play().catch(() => undefined);
  });
}

export function isFrozen(): boolean {
  return frozen;
}
