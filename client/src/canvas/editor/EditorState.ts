import type { Tool } from "./Tool";
import type { CanvasShape } from "../scene";

export const DEFAULT_TEXT_FONT_SIZE = 20;
export const DEFAULT_TEXT_FONT_FAMILY = "Arial";

class EditorState {
  currentTool: Tool = "rectangle";
  isDrawing = false;
  selectedShape: CanvasShape | null = null;
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
  textFontSize = DEFAULT_TEXT_FONT_SIZE;
  textFontFamily = DEFAULT_TEXT_FONT_FAMILY;

  setTool(tool: Tool) {
    this.currentTool = tool;
  }
  clearSelection() {
    this.selectedShape = null;
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
    this.selectedShape = shape;
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
  startTextEditing(x: number, y: number) {
    this.textEditing = true;
    this.textX = x;
    this.textY = y;
    this.textValue = "";
    this.onChange?.();
  }
  updateTextValue(value: string) {
    this.textValue = value;
    this.onChange?.();
  }

  finishTextEditing() {
    this.textEditing = false;
    this.onChange?.();
  }
}

export default EditorState;
