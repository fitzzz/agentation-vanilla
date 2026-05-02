import type { Annotation } from "./types";

function cloneAnnotation(annotation: Annotation): Annotation {
  return {
    ...annotation,
    classList: annotation.classList ? [...annotation.classList] : undefined,
    rect: { ...annotation.rect },
  };
}

function renumber(annotations: Annotation[]): Annotation[] {
  return annotations.map((annotation, index) => ({
    ...annotation,
    number: index + 1,
  }));
}

export class AnnotationState {
  private annotations: Annotation[];

  constructor(initialAnnotations: Annotation[] = []) {
    this.annotations = renumber(initialAnnotations.map(cloneAnnotation));
  }

  getAll(): Annotation[] {
    return this.annotations.map(cloneAnnotation);
  }

  setAll(annotations: Annotation[]): Annotation[] {
    this.annotations = renumber(annotations.map(cloneAnnotation));
    return this.getAll();
  }

  add(annotation: Annotation): Annotation[] {
    this.annotations = renumber([...this.annotations, cloneAnnotation(annotation)]);
    return this.getAll();
  }

  update(id: string, patch: Partial<Annotation>): Annotation[] {
    this.annotations = renumber(
      this.annotations.map((annotation) =>
        annotation.id === id ? { ...annotation, ...patch, id: annotation.id } : annotation,
      ),
    );
    return this.getAll();
  }

  delete(id: string): Annotation[] {
    this.annotations = renumber(this.annotations.filter((annotation) => annotation.id !== id));
    return this.getAll();
  }

  clear(): Annotation[] {
    this.annotations = [];
    return [];
  }
}
