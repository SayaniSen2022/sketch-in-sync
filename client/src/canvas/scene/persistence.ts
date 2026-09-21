import type { CanvasShape } from "./types";
import { BACKGROUND_COLORS, DEFAULT_CANVAS_BACKGROUND } from "../stylePresets";
import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM, type Viewport } from "../viewport";

const STORAGE_KEY = "sketch-in-sync:scene:v1";
const STORAGE_VERSION = 3;

interface StoredDocument {
  version: number;
  shapes: CanvasShape[];
  backgroundColor: string;
  viewport: Viewport;
}

interface StoredSceneV1 {
  version: number;
  shapes: CanvasShape[];
}

let hasReportedStorageError = false;

export function loadStoredDocument(): {
  shapes: CanvasShape[];
  backgroundColor: string;
  viewport: Viewport;
} {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) return emptyDocument();

    const storedScene: unknown = JSON.parse(value);

    if (isStoredDocument(storedScene)) {
      return {
        shapes: storedScene.shapes,
        backgroundColor: storedScene.backgroundColor,
        viewport: storedScene.viewport,
      };
    }

    if (isStoredSceneV1(storedScene)) {
      return {
        shapes: storedScene.shapes,
        backgroundColor: DEFAULT_CANVAS_BACKGROUND,
        viewport: { ...DEFAULT_VIEWPORT },
      };
    }

    return emptyDocument();
  } catch {
    reportStorageError();
    return emptyDocument();
  }
}

export function saveStoredDocument(
  shapes: CanvasShape[],
  backgroundColor: string,
  viewport: Viewport,
): void {
  const storedScene: StoredDocument = {
    version: STORAGE_VERSION,
    shapes,
    backgroundColor,
    viewport,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedScene));
  } catch {
    reportStorageError();
  }
}

export function clearStoredDocument(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    reportStorageError();
  }
}

function emptyDocument(): { shapes: CanvasShape[]; backgroundColor: string; viewport: Viewport } {
  return {
    shapes: [],
    backgroundColor: DEFAULT_CANVAS_BACKGROUND,
    viewport: { ...DEFAULT_VIEWPORT },
  };
}

function isStoredDocument(value: unknown): value is StoredDocument {
  return (
    isRecord(value) &&
    value.version === STORAGE_VERSION &&
    Array.isArray(value.shapes) &&
    isBackgroundColor(value.backgroundColor) &&
    isViewport(value.viewport) &&
    value.shapes.every(isCanvasShape)
  );
}

function isViewport(value: unknown): value is Viewport {
  return (
    isRecord(value) &&
    hasNumbers(value, "offsetX", "offsetY", "zoom") &&
    typeof value.zoom === "number" &&
    value.zoom >= MIN_ZOOM &&
    value.zoom <= MAX_ZOOM
  );
}

function isStoredSceneV1(value: unknown): value is StoredSceneV1 {
  return (
    isRecord(value) &&
    (value.version === 1 || value.version === 2) &&
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

function isBackgroundColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    BACKGROUND_COLORS.includes(value as (typeof BACKGROUND_COLORS)[number])
  );
}

function reportStorageError(): void {
  if (hasReportedStorageError) return;

  hasReportedStorageError = true;
  console.warn("Canvas changes could not be saved to local storage.");
}
