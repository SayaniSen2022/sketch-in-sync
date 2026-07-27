import type { Tool } from "./Tool";
import type { CanvasShape } from "../scene";

class EditorState {
  currentTool: Tool = "rectangle";
  isDrawing = false;
  selectedShape: CanvasShape | null = null;
  currentShape: CanvasShape | null = null;

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
}

export default EditorState;
