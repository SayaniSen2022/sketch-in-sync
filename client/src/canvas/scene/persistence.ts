import type { CanvasShape } from "./types";
import { BACKGROUND_COLORS, DEFAULT_CANVAS_BACKGROUND } from "../stylePresets";
import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM, type Viewport } from "../viewport";

const LEGACY_STORAGE_KEY = "sketch-in-sync:scene:v1";
const DOCUMENT_STORAGE_PREFIX = "sketch-in-sync:scene:v1:";
const WORKSPACE_STORAGE_KEY = "sketch-in-sync:tabs:v1";
const STORAGE_VERSION = 3;
const WORKSPACE_VERSION = 1;

export const DEFAULT_TAB_ID = "default";

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

export interface StoredCanvasTab {
  id: string;
  title: string;
  isDefault: boolean;
}

interface StoredWorkspace {
  version: number;
  tabs: StoredCanvasTab[];
  activeTabId: string;
}

let hasReportedStorageError = false;

export function loadStoredDocument(tabId = DEFAULT_TAB_ID): {
  shapes: CanvasShape[];
  backgroundColor: string;
  viewport: Viewport;
} {
  try {
    const value =
      window.localStorage.getItem(getDocumentStorageKey(tabId)) ??
      (tabId === DEFAULT_TAB_ID ? window.localStorage.getItem(LEGACY_STORAGE_KEY) : null);

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
  tabId = DEFAULT_TAB_ID,
): void {
  const storedScene: StoredDocument = {
    version: STORAGE_VERSION,
    shapes,
    backgroundColor,
    viewport,
  };

  try {
    window.localStorage.setItem(getDocumentStorageKey(tabId), JSON.stringify(storedScene));
  } catch {
    reportStorageError();
  }
}

export function clearStoredDocument(tabId = DEFAULT_TAB_ID): void {
  try {
    window.localStorage.removeItem(getDocumentStorageKey(tabId));
  } catch {
    reportStorageError();
  }
}

export function loadStoredWorkspace(): { tabs: StoredCanvasTab[]; activeTabId: string } {
  try {
    const value = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (!value) return emptyWorkspace();

    const workspace: unknown = JSON.parse(value);
    if (!isStoredWorkspace(workspace)) return emptyWorkspace();

    return { tabs: workspace.tabs, activeTabId: workspace.activeTabId };
  } catch {
    reportStorageError();
    return emptyWorkspace();
  }
}

export function saveStoredWorkspace(tabs: StoredCanvasTab[], activeTabId: string): void {
  const workspace: StoredWorkspace = {
    version: WORKSPACE_VERSION,
    tabs,
    activeTabId,
  };

  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    reportStorageError();
  }
}

function getDocumentStorageKey(tabId: string): string {
  return `${DOCUMENT_STORAGE_PREFIX}${encodeURIComponent(tabId)}`;
}

function emptyWorkspace(): { tabs: StoredCanvasTab[]; activeTabId: string } {
  return {
    tabs: [{ id: DEFAULT_TAB_ID, title: "Untitled-1", isDefault: true }],
    activeTabId: DEFAULT_TAB_ID,
  };
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

function isStoredWorkspace(value: unknown): value is StoredWorkspace {
  return (
    isRecord(value) &&
    value.version === WORKSPACE_VERSION &&
    typeof value.activeTabId === "string" &&
    Array.isArray(value.tabs) &&
    value.tabs.length > 0 &&
    value.tabs.every(
      (tab) =>
        isRecord(tab) &&
        isNonEmptyString(tab.id) &&
        isNonEmptyString(tab.title) &&
        typeof tab.isDefault === "boolean",
    ) &&
    value.tabs.some((tab) => tab.id === value.activeTabId)
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
