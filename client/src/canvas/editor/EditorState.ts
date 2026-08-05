import type { Tool } from "./Tool";
import type { CanvasShape } from "../scene";

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
}

export default EditorState;
