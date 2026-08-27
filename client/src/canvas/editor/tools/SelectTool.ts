import type { ToolStrategy } from "./ToolStrategy";
import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import type { CanvasShape } from "@/canvas/scene";

class SelectTool implements ToolStrategy {
  private scene: Scene;
  private editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    const x = event.offsetX;
    const y = event.offsetY;

    const selectedShape = this.editor.selectedShape;

    // Check resize handles first
    if (selectedShape) {
      const handle = this.getResizeHandle(x, y, selectedShape);

      if (handle) {
        this.editor.startResizing(handle);
        return;
      }
    }

    // Otherwise select a shape
    const shape = this.scene.findShapeAt(x, y);

    this.editor.setSelectedShape(shape);

    if (shape) {
      this.editor.startDragging(x, y);
    }
  }

  onMouseMove(event: MouseEvent): void {
    const x = event.offsetX;
    const y = event.offsetY;

    const shape = this.editor.selectedShape;

    if (!shape) return;

    if (this.editor.isResizing) {
      this.resizeShape(shape, x, y);
      return;
    }
    if (!this.editor.isDragging) return;
    if (!shape) return;

    const dx = x - this.editor.dragOffsetX;
    const dy = y - this.editor.dragOffsetY;

    this.scene.moveShape(shape, dx, dy);

    this.editor.dragOffsetX = x;
    this.editor.dragOffsetY = y;
  }

  onMouseUp(): void {
    if (this.editor.isResizing) {
      this.editor.stopResizing();
      return;
    }

    if (this.editor.isDragging) {
      this.editor.stopDragging();
    }
  }

  private getResizeHandle(x: number, y: number, shape: CanvasShape): string | null {
    const handleSize = 8;

    switch (shape.type) {
      case "rectangle":
      case "ellipse": {
        const left = Math.min(shape.x, shape.x + shape.width);
        const right = Math.max(shape.x, shape.x + shape.width);

        const top = Math.min(shape.y, shape.y + shape.height);
        const bottom = Math.max(shape.y, shape.y + shape.height);

        if (Math.abs(x - left) <= handleSize && Math.abs(y - top) <= handleSize) {
          return "top-left";
        }

        if (Math.abs(x - right) <= handleSize && Math.abs(y - top) <= handleSize) {
          return "top-right";
        }

        if (Math.abs(x - left) <= handleSize && Math.abs(y - bottom) <= handleSize) {
          return "bottom-left";
        }

        if (Math.abs(x - right) <= handleSize && Math.abs(y - bottom) <= handleSize) {
          return "bottom-right";
        }

        return null;
      }

      case "line":
      case "arrow": {
        // Line/Arrow don't have width/height.
        // Their resize handles are their two endpoints.

        if (Math.abs(x - shape.x1) <= handleSize && Math.abs(y - shape.y1) <= handleSize) {
          return "start";
        }

        if (Math.abs(x - shape.x2) <= handleSize && Math.abs(y - shape.y2) <= handleSize) {
          return "end";
        }

        return null;
      }

      default:
        return null;
    }
  }
  private resizeShape(shape: CanvasShape, x: number, y: number): void {
    // if (shape.type !== "rectangle" && shape.type !== "ellipse") {
    //   return;
    // }

    const handle = this.editor.resizeHandle;

    if (!handle) return;

    switch (shape.type) {
      case "rectangle":
      case "ellipse":
        switch (handle) {
          case "top-left":
            shape.width = shape.x + shape.width - x;
            shape.height = shape.y + shape.height - y;

            shape.x = x;
            shape.y = y;
            break;

          case "top-right":
            shape.width = x - shape.x;
            shape.height = shape.y + shape.height - y;

            shape.y = y;
            break;

          case "bottom-left":
            shape.width = shape.x + shape.width - x;
            shape.height = y - shape.y;

            shape.x = x;
            break;

          case "bottom-right":
            shape.width = x - shape.x;
            shape.height = y - shape.y;
            break;
        }
        break;

      case "line":
      case "arrow":
        if (handle === "start") {
          shape.x1 = x;
          shape.y1 = y;
        }

        if (handle === "end") {
          shape.x2 = x;
          shape.y2 = y;
        }

        break;
    }
  }
}
export default SelectTool;
