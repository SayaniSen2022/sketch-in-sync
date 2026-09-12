import type { CanvasShape } from "./types";

const STORAGE_KEY = "sketch-in-sync:scene:v1";
const STORAGE_VERSION = 1;

interface StoredScene {
  version: number;
  shapes: CanvasShape[];
}

let hasReportedStorageError = false;

export function loadStoredScene(): CanvasShape[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) return [];

    const storedScene: unknown = JSON.parse(value);

    if (!isStoredScene(storedScene)) return [];

    return storedScene.shapes;
  } catch {
    reportStorageError();
    return [];
  }
}

export function saveStoredScene(shapes: CanvasShape[]): void {
  const storedScene: StoredScene = {
    version: STORAGE_VERSION,
    shapes,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedScene));
  } catch {
    reportStorageError();
  }
}

function isStoredScene(value: unknown): value is StoredScene {
  return (
    isRecord(value) &&
    value.version === STORAGE_VERSION &&
    Array.isArray(value.shapes) &&
    value.shapes.every(isCanvasShape)
  );
}

function isCanvasShape(value: unknown): value is CanvasShape {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.type)) {
    return false;
  }

  switch (value.type) {
    case "rectangle":
    case "ellipse":
      return (
        hasNumbers(value, "x", "y", "width", "height", "strokeWidth") &&
        hasStrings(value, "strokeColor", "fillColor")
      );

    case "line":
    case "arrow":
      return (
        hasNumbers(value, "x1", "y1", "x2", "y2", "strokeWidth") && hasStrings(value, "strokeColor")
      );

    case "text":
      return (
        hasNumbers(value, "x", "y", "fontSize") &&
        typeof value.fontSize === "number" &&
        value.fontSize > 0 &&
        hasStrings(value, "text", "fontFamily", "fillColor")
      );

    case "pencil":
      return (
        hasNumbers(value, "strokeWidth") &&
        hasStrings(value, "strokeColor") &&
        Array.isArray(value.points) &&
        value.points.every((point) => isRecord(point) && hasNumbers(point, "x", "y"))
      );

    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hasStrings(value: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "string");
}

function hasNumbers(value: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "number" && Number.isFinite(value[key]));
}

function reportStorageError(): void {
  if (hasReportedStorageError) return;

  hasReportedStorageError = true;
  console.warn("Canvas changes could not be saved to local storage.");
}
