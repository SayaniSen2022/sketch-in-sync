import type { Tool } from "./Tool";
import type { CanvasShape } from "../scene";
import {
  DEFAULT_CANVAS_BACKGROUND,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
} from "../stylePresets";
import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM, type Viewport } from "../viewport";

interface TextEditingOptions {
  value?: string;
  fontSize?: number;
  fontFamily?: string;
  caretIndex?: number;
}

class EditorState {
  currentTool: Tool = "select";
  isDrawing = false;
  selectedShapes: CanvasShape[] = [];
  isMarqueeSelecting = false;
  marqueeStartX = 0;
  marqueeStartY = 0;
  marqueeEndX = 0;
  marqueeEndY = 0;
  currentShape: CanvasShape | null = null;
  isDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;
  isResizing: boolean = false;
  resizeHandle: string | null = null;
  textEditing = false;

  textX = 0;
  textY = 0;

  textValue = "";
  textFontSize: number = DEFAULT_TEXT_FONT_SIZE;
  textFontFamily: string = DEFAULT_TEXT_FONT_FAMILY;
  textCaretIndex = 0;
  strokeColor: string = DEFAULT_STROKE_COLOR;
  strokeWidth: number = DEFAULT_STROKE_WIDTH;
  canvasBackgroundColor: string = DEFAULT_CANVAS_BACKGROUND;
  viewport: Viewport = { ...DEFAULT_VIEWPORT };

  setTool(tool: Tool) {
    this.currentTool = tool;
  }
  clearSelection() {
    this.setSelectedShapes([]);
  }
  startDrawing(shape: CanvasShape) {
    this.currentShape = shape;
    this.isDrawing = true;
  }
  finishDrawing() {
    this.currentShape = null;
    this.isDrawing = false;
  }
  setSelectedShape(shape: CanvasShape | null) {
    this.setSelectedShapes(shape ? [shape] : []);
  }
  get selectedShape(): CanvasShape | null {
    return this.selectedShapes[0] ?? null;
  }
  setSelectedShapes(shapes: CanvasShape[]) {
    this.selectedShapes = shapes;
    const shape = this.selectedShape;

    if (shape) {
      switch (shape.type) {
        case "rectangle":
        case "ellipse":
        case "line":
        case "arrow":
        case "pencil":
          this.strokeColor = shape.strokeColor;
          this.strokeWidth = shape.strokeWidth;
          break;

        case "text":
          this.textFontSize = shape.fontSize;
          this.textFontFamily = shape.fontFamily;
          this.strokeColor = shape.fillColor;
          break;
      }
    }

    this.onChange?.();
  }
  toggleSelectedShape(shape: CanvasShape) {
    this.setSelectedShapes(
      this.selectedShapes.includes(shape)
        ? this.selectedShapes.filter((selected) => selected !== shape)
        : [...this.selectedShapes, shape],
    );
  }
  startMarqueeSelection(x: number, y: number) {
    this.isMarqueeSelecting = true;
    this.marqueeStartX = x;
    this.marqueeStartY = y;
    this.marqueeEndX = x;
    this.marqueeEndY = y;
  }
  updateMarqueeSelection(x: number, y: number) {
    this.marqueeEndX = x;
    this.marqueeEndY = y;
  }
  stopMarqueeSelection() {
    this.isMarqueeSelecting = false;
  }
  startDragging(x: number, y: number) {
    this.isDragging = true;

    this.dragStartX = x;
    this.dragStartY = y;

    this.dragOffsetX = x;
    this.dragOffsetY = y;
  }
  stopDragging() {
    this.isDragging = false;
  }
  startResizing(handle: string): void {
    this.isResizing = true;
    this.resizeHandle = handle;
  }
  stopResizing() {
    this.isResizing = false;
    this.resizeHandle = null;
  }
  private onChange: (() => void) | null = null;

  setOnChange(callback: () => void) {
    this.onChange = callback;
  }
  startTextEditing(x: number, y: number, options: TextEditingOptions = {}) {
    this.textEditing = true;
    this.textX = x;
    this.textY = y;
    this.textValue = options.value ?? "";
    this.textFontSize = options.fontSize ?? this.textFontSize;
    this.textFontFamily = options.fontFamily ?? this.textFontFamily;
    this.textCaretIndex = options.caretIndex ?? 0;
    this.onChange?.();
  }
  updateTextValue(value: string) {
    this.textValue = value;
    this.onChange?.();
  }

  setStrokeColor(color: string) {
    this.strokeColor = color;
    this.onChange?.();
  }

  setStrokeWidth(width: number) {
    this.strokeWidth = width;
    this.onChange?.();
  }

  setTextFontSize(size: number) {
    this.textFontSize = size;
    this.onChange?.();
  }

  setTextFontFamily(fontFamily: string) {
    this.textFontFamily = fontFamily;
    this.onChange?.();
  }

  setCanvasBackgroundColor(color: string) {
    this.canvasBackgroundColor = color;
    this.onChange?.();
  }

  setViewport(viewport: Viewport) {
    this.viewport = {
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom)),
    };
    this.onChange?.();
  }

  panBy(deltaX: number, deltaY: number) {
    this.setViewport({
      ...this.viewport,
      offsetX: this.viewport.offsetX + deltaX,
      offsetY: this.viewport.offsetY + deltaY,
    });
  }

  finishTextEditing() {
    this.textEditing = false;
    this.onChange?.();
  }
}

export default EditorState;
