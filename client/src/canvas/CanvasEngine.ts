import RectangleTool from "./editor/tools/RectangleTool";
import Scene from "./scene/Scene";
import CanvasRenderer from "./CanvasRenderer";
import EditorState from "./editor/EditorState";
import type { ToolStrategy } from "./editor/tools/ToolStrategy";
import type { CanvasPointerEvent } from "./editor/tools/ToolStrategy";
import type { Tool } from "./editor/Tool";
import type { CanvasShape } from "./scene";

import EllipseTool from "./editor/tools/EllipseTool";
import LineTool from "./editor/tools/LineTool";
import ArrowTool from "./editor/tools/ArrowTool";
import SelectTool from "./editor/tools/SelectTool";
import PencilTool from "./editor/tools/PencilTool";
import TextTool from "./editor/tools/TextTool";
import EraserTool from "./editor/tools/EraserTool";
import { loadStoredDocument, saveStoredDocument } from "./scene/persistence";
import { MAX_ZOOM, MIN_ZOOM } from "./viewport";

const AUTOSAVE_DELAY_MS = 350;
const MAX_HISTORY_ENTRIES = 100;

const ONE_SHOT_DRAWING_TOOLS = new Set<Tool>(["rectangle", "ellipse", "line", "arrow", "pencil"]);

export interface CanvasHistory {
  undoStack: CanvasShape[][];
  redoStack: CanvasShape[][];
}

class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private readonly tabId: string;
  private ctx: CanvasRenderingContext2D | null = null;

  private scene = new Scene();
  private renderer!: CanvasRenderer;

  private editor = new EditorState();

  private tools!: Record<Exclude<Tool, "hand">, ToolStrategy>;
  private activeTool!: ToolStrategy;
  private saveTimer: number | null = null;
  private shouldPersistOnDestroy = true;
  private isSpacePressed = false;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private drawingStart: { x: number; y: number } | null = null;
  private hasMovedWhileDrawing = false;
  private onToolChange: ((tool: Tool) => void) | null = null;
  private onHistoryChange: ((history: CanvasHistory) => void) | null = null;
  private undoStack: CanvasShape[][] = [];
  private redoStack: CanvasShape[][] = [];
  private drawingHistorySnapshot: CanvasShape[] | null = null;
  private interactionHistorySnapshot: CanvasShape[] | null = null;

  constructor(canvas: HTMLCanvasElement, tabId: string) {
    this.canvas = canvas;
    this.tabId = tabId;
  }

  init() {
    this.ctx = this.canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Failed to get 2D rendering context.");
    }

    this.renderer = new CanvasRenderer(this.ctx);
    const storedDocument = loadStoredDocument(this.tabId);
    this.scene.replaceShapes(storedDocument.shapes);
    this.editor.setCanvasBackgroundColor(storedDocument.backgroundColor);
    this.editor.setViewport(storedDocument.viewport);

    this.tools = {
      rectangle: new RectangleTool(this.scene, this.editor),

      ellipse: new EllipseTool(this.scene, this.editor),

      line: new LineTool(this.scene, this.editor),

      arrow: new ArrowTool(this.scene, this.editor),

      pencil: new PencilTool(this.scene, this.editor),

      text: new TextTool(this.scene, this.editor),

      select: new SelectTool(this.scene, this.editor),

      eraser: new EraserTool(this.scene, this.editor),
    };

    this.activeTool = this.tools.select;

    this.resizeCanvas();
    this.attachEventListeners();

    this.render(false);
    this.saveScene();
  }

  public setTool(tool: Tool) {
    if (tool === "hand") {
      this.commitTextWithHistory();
      this.saveScene();
      this.editor.setTool(tool);
      this.onToolChange?.(tool);
      this.updateCursor();
      this.render();
      return;
    }

    const nextTool = this.tools[tool];

    if (!nextTool) {
      console.error(`Tool "${tool}" is not registered.`);
      return;
    }

    // Let the current tool finish in-progress work before switching away.
    this.commitTextWithHistory();
    this.saveScene();

    this.editor.setTool(tool);
    this.activeTool = nextTool;
    this.onToolChange?.(tool);
    this.updateCursor();
    this.render();
  }

  /**
   * Commits the active tool's in-progress work (e.g. the text draft), if any.
   */
  public finishTextEditing() {
    const committedShape = this.commitTextWithHistory();

    if (this.editor.currentTool === "text" && committedShape) {
      this.editor.setSelectedShape(committedShape);
      this.switchToSelectTool();
      this.render(false);
    }

    this.saveScene();
  }

  public setOnToolChange(callback: (tool: Tool) => void) {
    this.onToolChange = callback;
  }

  public setOnHistoryChange(callback: (history: CanvasHistory) => void) {
    this.onHistoryChange = callback;
    this.notifyHistoryChange();
  }

  public setHistory(history: CanvasHistory | undefined) {
    this.undoStack = this.cloneHistoryStack(history?.undoStack ?? []);
    this.redoStack = this.cloneHistoryStack(history?.redoStack ?? []);
    this.notifyHistoryChange();
  }

  public undo() {
    const previousShapes = this.undoStack.pop();
    if (!previousShapes) return;

    this.redoStack.push(this.cloneShapes());
    this.restoreShapes(previousShapes);
  }

  public redo() {
    const nextShapes = this.redoStack.pop();
    if (!nextShapes) return;

    this.undoStack.push(this.cloneShapes());
    this.restoreShapes(nextShapes);
  }

  public setStrokeColor(color: string) {
    const historySnapshot = this.getShapeEditHistorySnapshot();
    this.getActiveShapes().forEach((shape) => {
      switch (shape.type) {
        case "rectangle":
        case "ellipse":
        case "line":
        case "arrow":
        case "pencil":
          shape.strokeColor = color;
          break;
        case "text":
          shape.fillColor = color;
          break;
      }
    });

    this.editor.setStrokeColor(color);
    this.recordHistorySnapshot(historySnapshot);
    this.saveScene();
  }

  public setStrokeWidth(width: number) {
    const historySnapshot = this.getShapeEditHistorySnapshot();
    this.getActiveShapes().forEach((shape) => {
      switch (shape.type) {
        case "rectangle":
        case "ellipse":
        case "line":
        case "arrow":
        case "pencil":
          shape.strokeWidth = width;
          break;
      }
    });

    this.editor.setStrokeWidth(width);
    this.recordHistorySnapshot(historySnapshot);
    this.saveScene();
  }

  public setTextFontSize(size: number) {
    const historySnapshot = this.getShapeEditHistorySnapshot();
    this.getActiveShapes().forEach((shape) => {
      if (shape.type === "text") shape.fontSize = size;
    });

    this.editor.setTextFontSize(size);
    this.recordHistorySnapshot(historySnapshot);

    if (!this.editor.textEditing) {
      this.saveScene();
    }
  }

  public setTextFontFamily(fontFamily: string) {
    const historySnapshot = this.getShapeEditHistorySnapshot();
    this.getActiveShapes().forEach((shape) => {
      if (shape.type === "text") shape.fontFamily = fontFamily;
    });

    this.editor.setTextFontFamily(fontFamily);
    this.recordHistorySnapshot(historySnapshot);

    if (!this.editor.textEditing) {
      this.saveScene();
    }
  }

  public setCanvasBackgroundColor(color: string) {
    this.editor.setCanvasBackgroundColor(color);
    this.saveScene();
  }

  public clearCanvas() {
    this.commitTextWithHistory();
    const historySnapshot = this.scene.getShapes().length > 0 ? this.cloneShapes() : null;
    this.scene.clear();
    this.editor.clearSelection();
    this.editor.finishDrawing();
    this.editor.stopDragging();
    this.editor.stopResizing();
    this.recordHistorySnapshot(historySnapshot);
    this.render(false);
    this.saveScene();
  }

  public zoomBy(delta: number) {
    this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, this.editor.viewport.zoom + delta);
  }

  public resetZoom() {
    this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1);
  }

  /**
   * Gives React/UI access to the editor state.
   */
  public getEditor(): EditorState {
    return this.editor;
  }

  /**
   * Optional: gives access to the scene if needed later.
  
  public getScene(): Scene {
    return this.scene;
  } */

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private attachEventListeners() {
    window.addEventListener("resize", this.handleResize);

    this.canvas.addEventListener("mousedown", this.handleMouseDown);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    window.addEventListener("mouseup", this.handleMouseUp);

    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleMouseDown = (event: MouseEvent) => {
    if (
      event.button === 1 ||
      (event.button === 0 && (this.isSpacePressed || this.editor.currentTool === "hand"))
    ) {
      event.preventDefault();
      this.isPanning = true;
      const point = this.getCanvasPoint(event);
      this.panStartX = point.x;
      this.panStartY = point.y;
      this.canvas.style.cursor = "grabbing";
      return;
    }

    if (event.button !== 0) return;

    if (this.editor.currentTool === "text" && this.editor.textEditing) {
      this.finishTextEditing();
      return;
    }

    const pointerEvent = this.getWorldPointerEvent(event);

    if (ONE_SHOT_DRAWING_TOOLS.has(this.editor.currentTool)) {
      this.drawingStart = { x: pointerEvent.x, y: pointerEvent.y };
      this.hasMovedWhileDrawing = false;
      this.drawingHistorySnapshot = this.cloneShapes();
    } else if (this.editor.currentTool === "select") {
      this.interactionHistorySnapshot = this.cloneShapes();
    }

    const eraserHistorySnapshot = this.editor.currentTool === "eraser" ? this.cloneShapes() : null;
    const shapeCountBeforeErasing = this.scene.getShapes().length;

    this.execute(() => {
      this.activeTool.onMouseDown(pointerEvent);
    });
    if (shapeCountBeforeErasing !== this.scene.getShapes().length) {
      this.recordHistorySnapshot(eraserHistorySnapshot);
    }
    this.updateCursor(pointerEvent);
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (this.isPanning) {
      const point = this.getCanvasPoint(event);
      this.editor.panBy(point.x - this.panStartX, point.y - this.panStartY);
      this.panStartX = point.x;
      this.panStartY = point.y;
      this.canvas.style.cursor = "grabbing";
      return;
    }
    const pointerEvent = this.getWorldPointerEvent(event);
    if (
      this.drawingStart &&
      (pointerEvent.x !== this.drawingStart.x || pointerEvent.y !== this.drawingStart.y)
    ) {
      this.hasMovedWhileDrawing = true;
    }
    this.execute(() => {
      this.activeTool.onMouseMove(pointerEvent);
    });
    this.updateCursor(pointerEvent);
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (this.isPanning) {
      this.isPanning = false;
      this.saveScene();
      this.updateCursor();
      return;
    }
    const pointerEvent = this.getWorldPointerEvent(event);
    const drawnShape = this.editor.currentShape;
    const isCompletingDrawing =
      ONE_SHOT_DRAWING_TOOLS.has(this.editor.currentTool) && this.editor.isDrawing && drawnShape;

    if (
      this.drawingStart &&
      (pointerEvent.x !== this.drawingStart.x || pointerEvent.y !== this.drawingStart.y)
    ) {
      this.hasMovedWhileDrawing = true;
    }

    this.activeTool.onMouseUp(pointerEvent);

    if (isCompletingDrawing) {
      if (this.hasMovedWhileDrawing) {
        this.editor.setSelectedShape(drawnShape);
        this.recordHistorySnapshot(this.drawingHistorySnapshot);
        this.switchToSelectTool();
      } else {
        this.scene.removeShape(drawnShape);
      }
    }

    if (this.interactionHistorySnapshot && this.hasSceneChanged(this.interactionHistorySnapshot)) {
      this.recordHistorySnapshot(this.interactionHistorySnapshot);
    }

    this.drawingStart = null;
    this.hasMovedWhileDrawing = false;
    this.drawingHistorySnapshot = null;
    this.interactionHistorySnapshot = null;
    this.render(false);
    this.updateCursor(pointerEvent);
    this.saveScene();
  };

  private handleDoubleClick = (event: MouseEvent) => {
    const historySnapshot = this.cloneShapes();
    this.execute(() => {
      this.activeTool.onDoubleClick(this.getWorldPointerEvent(event));
    });
    if (this.editor.textEditing) this.recordHistorySnapshot(historySnapshot);
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    if (!event.ctrlKey && !event.metaKey) {
      const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      this.editor.panBy(-event.deltaX * deltaMultiplier, -event.deltaY * deltaMultiplier);
      return;
    }

    const point = this.getCanvasPoint(event);
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.zoomAt(point.x, point.y, this.editor.viewport.zoom * factor);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLTextAreaElement) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      this.redo();
      return;
    }

    if (event.code === "Space" && !(event.target instanceof HTMLTextAreaElement)) {
      this.isSpacePressed = true;
      event.preventDefault();
      return;
    }
    if (
      (event.code === "ArrowUp" || event.code === "ArrowDown") &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      this.editor.panBy(0, event.code === "ArrowUp" ? 48 : -48);
      event.preventDefault();
      return;
    }
    if (event.key !== "Delete") return;
    if (this.editor.selectedShapes.length === 0) return;
    event.preventDefault();
    const historySnapshot = this.cloneShapes();
    this.scene.removeShapes(this.editor.selectedShapes);
    this.editor.clearSelection();
    this.recordHistorySnapshot(historySnapshot);
    this.render(false);
    this.saveScene();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === "Space") this.isSpacePressed = false;
  };

  private commitTextWithHistory(): CanvasShape | null {
    const historySnapshot = this.editor.currentTool === "text" ? this.cloneShapes() : null;
    const committedShape = this.activeTool.commitText();

    if (committedShape) this.recordHistorySnapshot(historySnapshot);

    return committedShape;
  }

  private getShapeEditHistorySnapshot(): CanvasShape[] | null {
    if (
      this.editor.textEditing ||
      this.editor.currentShape ||
      this.editor.selectedShapes.length === 0
    ) {
      return null;
    }

    return this.cloneShapes();
  }

  private cloneShapes(): CanvasShape[] {
    return JSON.parse(JSON.stringify(this.scene.getShapes())) as CanvasShape[];
  }

  private cloneHistoryStack(historyStack: CanvasShape[][]): CanvasShape[][] {
    return JSON.parse(JSON.stringify(historyStack)) as CanvasShape[][];
  }

  private hasSceneChanged(snapshot: CanvasShape[]): boolean {
    return JSON.stringify(snapshot) !== JSON.stringify(this.scene.getShapes());
  }

  private recordHistorySnapshot(snapshot: CanvasShape[] | null) {
    if (!snapshot || !this.hasSceneChanged(snapshot)) return;

    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY_ENTRIES) this.undoStack.shift();
    this.redoStack = [];
    this.notifyHistoryChange();
  }

  private restoreShapes(shapes: CanvasShape[]) {
    this.scene.replaceShapes(JSON.parse(JSON.stringify(shapes)) as CanvasShape[]);
    this.editor.clearSelection();
    this.editor.finishDrawing();
    this.editor.stopDragging();
    this.editor.stopResizing();
    this.render(false);
    this.saveScene();
    this.notifyHistoryChange();
  }

  private notifyHistoryChange() {
    this.onHistoryChange?.({
      undoStack: this.cloneHistoryStack(this.undoStack),
      redoStack: this.cloneHistoryStack(this.redoStack),
    });
  }

  private execute(action: () => void) {
    action();
    this.render();
  }

  private updateCursor(event?: CanvasPointerEvent) {
    if (this.editor.currentTool !== "select") {
      this.canvas.style.cursor = "";
      return;
    }

    this.canvas.style.cursor = event ? this.tools.select.getCursor(event) : "default";
  }

  private switchToSelectTool() {
    this.editor.setTool("select");
    this.activeTool = this.tools.select;
    this.onToolChange?.("select");
  }

  private handleResize = () => {
    this.resizeCanvas();
    this.render(false);
  };

  public render(scheduleSave = true) {
    this.renderer.render(this.scene, this.editor, this.editor.viewport);

    if (scheduleSave && !this.editor.textEditing) {
      this.scheduleSave();
    }
  }

  public discardOnDestroy() {
    this.shouldPersistOnDestroy = false;
    this.cancelScheduledSave();
  }

  destroy() {
    if (this.shouldPersistOnDestroy) {
      this.activeTool.commitText();
      this.saveScene();
    } else {
      this.cancelScheduledSave();
    }

    window.removeEventListener("resize", this.handleResize);

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);

    this.canvas.removeEventListener("mousemove", this.handleMouseMove);

    window.removeEventListener("mouseup", this.handleMouseUp);

    this.canvas.removeEventListener("dblclick", this.handleDoubleClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  private scheduleSave() {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }

    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.saveScene();
    }, AUTOSAVE_DELAY_MS);
  }

  private saveScene() {
    this.cancelScheduledSave();

    saveStoredDocument(
      this.scene.getShapes(),
      this.editor.canvasBackgroundColor,
      this.editor.viewport,
      this.tabId,
    );
  }

  private getActiveShapes(): CanvasShape[] {
    return this.editor.currentShape ? [this.editor.currentShape] : this.editor.selectedShapes;
  }

  private cancelScheduledSave() {
    if (this.saveTimer === null) return;

    window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }

  private getCanvasPoint(event: MouseEvent | WheelEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (event.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private getWorldPointerEvent(event: MouseEvent): CanvasPointerEvent {
    const point = this.getCanvasPoint(event);
    const { offsetX, offsetY, zoom } = this.editor.viewport;
    return {
      x: (point.x - offsetX) / zoom,
      y: (point.y - offsetY) / zoom,
      shiftKey: event.shiftKey,
    };
  }

  private zoomAt(screenX: number, screenY: number, targetZoom: number) {
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
    const viewport = this.editor.viewport;
    const worldX = (screenX - viewport.offsetX) / viewport.zoom;
    const worldY = (screenY - viewport.offsetY) / viewport.zoom;
    this.editor.setViewport({
      offsetX: screenX - worldX * zoom,
      offsetY: screenY - worldY * zoom,
      zoom,
    });
  }
}

export default CanvasEngine;
