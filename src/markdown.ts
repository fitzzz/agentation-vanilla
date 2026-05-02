import type { Annotation, Rect } from "./types";

function escapeBackticks(value: string): string {
  return value.replace(/`/g, "\\`");
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function formatRect(rect: Rect): string {
  return `x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(
    rect.width,
  )}, height=${Math.round(rect.height)}`;
}

export function formatMarkdown(
  annotations: Annotation[],
  pagePath: string,
  pageUrl?: string,
): string {
  if (annotations.length === 0) return "";

  const viewport =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "unknown";

  const lines = [
    `## UI annotations for ${pagePath}`,
    "",
    pageUrl ? `Page URL: ${pageUrl}` : undefined,
    `Viewport: ${viewport}`,
    "",
  ].filter((line): line is string => line !== undefined);

  for (const annotation of annotations) {
    lines.push(`### ${annotation.number}. ${annotation.targetType} target`);
    lines.push(`Feedback: ${annotation.feedback}`);
    lines.push(`Selector: \`${escapeBackticks(annotation.selector)}\``);
    lines.push(`Page path: ${annotation.path}`);

    const metadata: string[] = [];
    if (annotation.tagName) metadata.push(`tag=${annotation.tagName}`);
    if (annotation.idAttribute) metadata.push(`id=${annotation.idAttribute}`);
    if (annotation.classList?.length) metadata.push(`classes=${annotation.classList.join(" ")}`);
    if (metadata.length > 0) lines.push(`Element: ${metadata.join(", ")}`);

    if (annotation.accessibleName) {
      lines.push(`Accessible name: ${quote(annotation.accessibleName)}`);
    }
    if (annotation.textSnippet) {
      lines.push(`Text/snippet: ${quote(annotation.textSnippet)}`);
    }

    lines.push(`Rect: ${formatRect(annotation.rect)}`);
    lines.push(`Created: ${annotation.createdAt}`);
    if (annotation.updatedAt !== annotation.createdAt) {
      lines.push(`Updated: ${annotation.updatedAt}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
