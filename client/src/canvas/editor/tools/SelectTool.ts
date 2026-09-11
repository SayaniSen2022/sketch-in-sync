import { ToolStrategy } from "./ToolStrategy";
import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import type { CanvasShape, Text } from "@/canvas/scene";

type CornerHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface TextResizeState {
  handle: CornerHandle;
  anchorX: number;
  anchorY: number;
  startVectorX: number;
  startVectorY: number;
  startFontSize: number;
}

const MIN_TEXT_FONT_SIZE = 4;

class SelectTool extends ToolStrategy {
  private scene: Scene;
  private editor: EditorState;
  private textResizeState: TextResizeState | null = null;
  private editingText: Text | null = null;
  constructor(scene: Scene, editor: EditorState) {
    super();
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
        if (selectedShape.type === "text" && this.isCornerHandle(handle)) {
          this.startTextResize(selectedShape, handle);
        }
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
      this.textResizeState = null;
      return;
    }

    if (this.editor.isDragging) {
      this.editor.stopDragging();
    }
  }

  /** Double-click a text shape to re-enter editing mode for it. */
  onDoubleClick(event: MouseEvent): void {
    const shape = this.scene.findShapeAt(event.offsetX, event.offsetY);

    if (!shape || shape.type !== "text") return;

    const caretIndex = this.scene.getTextCaretIndex(shape, event.offsetX, event.offsetY);

    this.scene.removeShape(shape);
    this.editor.clearSelection();
    this.editingText = shape;
    this.editor.startTextEditing(shape.x, shape.y, {
      value: shape.text,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      caretIndex,
    });
  }

  commitText(): void {
    if (!this.editor.textEditing || !this.editingText) return;

    const shape = this.editingText;
    this.editingText = null;

    if (this.editor.textValue.trim()) {
      shape.x = this.editor.textX;
      shape.y = this.editor.textY;
      shape.text = this.editor.textValue;
      shape.fontSize = this.editor.textFontSize;
      shape.fontFamily = this.editor.textFontFamily;
      this.scene.addShape(shape);
      this.editor.setSelectedShape(shape);
    } else {
      this.editor.clearSelection();
    }

    this.editor.finishTextEditing();
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

      case "text": {
        const { left, top, right, bottom } = this.scene.getTextBounds(shape);

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

      case "text":
        this.resizeText(shape, x, y);
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

  private isCornerHandle(handle: string): handle is CornerHandle {
    return ["top-left", "top-right", "bottom-left", "bottom-right"].includes(handle);
  }

  private startTextResize(text: Text, handle: CornerHandle): void {
    const { left, top, right, bottom } = this.scene.getTextBounds(text);
    const [anchorX, anchorY, handleX, handleY] =
      handle === "top-left"
        ? [right, bottom, left, top]
        : handle === "top-right"
          ? [left, bottom, right, top]
          : handle === "bottom-left"
            ? [right, top, left, bottom]
            : [left, top, right, bottom];

    this.textResizeState = {
      handle,
      anchorX,
      anchorY,
      startVectorX: handleX - anchorX,
      startVectorY: handleY - anchorY,
      startFontSize: text.fontSize,
    };
  }

  private resizeText(text: Text, x: number, y: number): void {
    const state = this.textResizeState;

    if (!state) return;

    const startLengthSquared = state.startVectorX ** 2 + state.startVectorY ** 2;

    if (startLengthSquared === 0) return;

    const scale = Math.max(
      MIN_TEXT_FONT_SIZE / state.startFontSize,
      ((x - state.anchorX) * state.startVectorX + (y - state.anchorY) * state.startVectorY) /
        startLengthSquared,
    );

    text.fontSize = state.startFontSize * scale;

    const bounds = this.scene.getTextBounds(text);

    if (state.handle === "top-left" || state.handle === "bottom-left") {
      text.x = state.anchorX - (bounds.right - bounds.left);
    } else {
      text.x = state.anchorX;
    }

    if (state.handle === "top-left" || state.handle === "top-right") {
      text.y = state.anchorY - (bounds.bottom - bounds.top);
    } else {
      text.y = state.anchorY;
    }
  }
}
export default SelectTool;
