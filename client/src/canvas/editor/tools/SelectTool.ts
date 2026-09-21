import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";
import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import type { CanvasShape, Pencil, Text } from "@/canvas/scene";

type CornerHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface TextResizeState {
  handle: CornerHandle;
  anchorX: number;
  anchorY: number;
  startVectorX: number;
  startVectorY: number;
  startFontSize: number;
}

interface PencilResizeState {
  handle: CornerHandle;
  anchorX: number;
  anchorY: number;
  startVectorX: number;
  startVectorY: number;
  startStrokeWidth: number;
  startPoints: { x: number; y: number }[];
}

interface PencilRotationState {
  centerX: number;
  centerY: number;
  startAngle: number;
  startPoints: { x: number; y: number }[];
}
interface GroupResizeState {
  anchorX: number;
  anchorY: number;
  vectorX: number;
  vectorY: number;
  shapes: CanvasShape[];
}

const MIN_TEXT_FONT_SIZE = 4;
const MIN_PENCIL_STROKE_WIDTH = 0.5;
const MIN_PENCIL_SCALE = 0.05;
const PENCIL_ROTATION_HANDLE_OFFSET = 24;
const PENCIL_ROTATION_HANDLE_RADIUS = 8;

class SelectTool extends ToolStrategy {
  private scene: Scene;
  private editor: EditorState;
  private textResizeState: TextResizeState | null = null;
  private pencilResizeState: PencilResizeState | null = null;
  private pencilRotationState: PencilRotationState | null = null;
  private editingText: Text | null = null;
  private groupResizeState: GroupResizeState | null = null;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    const x = event.x;
    const y = event.y;

    const selectedShape =
      this.editor.selectedShapes.length === 1 ? this.editor.selectedShape : null;

    if (this.editor.selectedShapes.length > 1) {
      const handle = this.getGroupResizeHandle(x, y);
      if (handle) {
        this.startGroupResize(handle);
        this.editor.startResizing(handle);
        return;
      }
    }

    // Check resize handles first
    if (selectedShape) {
      if (selectedShape.type === "pencil" && this.isPencilRotationHandle(x, y, selectedShape)) {
        this.startPencilRotation(selectedShape, x, y);
        this.editor.startResizing("rotate");
        return;
      }

      const handle = this.getResizeHandle(x, y, selectedShape);

      if (handle) {
        if (selectedShape.type === "text" && this.isCornerHandle(handle)) {
          this.startTextResize(selectedShape, handle);
        }
        if (selectedShape.type === "pencil" && this.isCornerHandle(handle)) {
          this.startPencilResize(selectedShape, handle);
        }
        this.editor.startResizing(handle);
        return;
      }
    }

    const shape = this.scene.findShapeAt(x, y, 6 / this.editor.viewport.zoom);
    if (shape) {
      if (event.shiftKey) {
        this.editor.toggleSelectedShape(shape);
        return;
      }
      if (!this.editor.selectedShapes.includes(shape)) this.editor.setSelectedShape(shape);
      this.editor.startDragging(x, y);
    } else {
      if (!event.shiftKey) this.editor.clearSelection();
      this.editor.startMarqueeSelection(x, y);
    }
  }

  onMouseMove(event: CanvasPointerEvent): void {
    const x = event.x;
    const y = event.y;

    if (this.editor.isMarqueeSelecting) {
      this.editor.updateMarqueeSelection(x, y);
      return;
    }

    if (this.editor.isResizing && this.groupResizeState) {
      this.resizeGroup(x, y);
      return;
    }

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

    this.editor.selectedShapes.forEach((selected) => this.scene.moveShape(selected, dx, dy));

    this.editor.dragOffsetX = x;
    this.editor.dragOffsetY = y;
  }

  onMouseUp(): void {
    if (this.editor.isMarqueeSelecting) {
      const left = Math.min(this.editor.marqueeStartX, this.editor.marqueeEndX);
      const top = Math.min(this.editor.marqueeStartY, this.editor.marqueeEndY);
      const right = Math.max(this.editor.marqueeStartX, this.editor.marqueeEndX);
      const bottom = Math.max(this.editor.marqueeStartY, this.editor.marqueeEndY);
      this.editor.setSelectedShapes(this.scene.getShapesInBounds(left, top, right, bottom));
      this.editor.stopMarqueeSelection();
      return;
    }
    if (this.editor.isResizing) {
      this.editor.stopResizing();
      this.textResizeState = null;
      this.pencilResizeState = null;
      this.pencilRotationState = null;
      this.groupResizeState = null;
      return;
    }

    if (this.editor.isDragging) {
      this.editor.stopDragging();
    }
  }

  /** Double-click a text shape to re-enter editing mode for it. */
  onDoubleClick(event: CanvasPointerEvent): void {
    const shape = this.scene.findShapeAt(event.x, event.y, 6 / this.editor.viewport.zoom);

    if (!shape || shape.type !== "text") return;

    const caretIndex = this.scene.getTextCaretIndex(shape, event.x, event.y);

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
    const handleSize = 8 / this.editor.viewport.zoom;

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

      case "pencil": {
        const bounds = this.scene.getPencilBounds(shape);

        if (!bounds) return null;

        if (Math.abs(x - bounds.left) <= handleSize && Math.abs(y - bounds.top) <= handleSize) {
          return "top-left";
        }

        if (Math.abs(x - bounds.right) <= handleSize && Math.abs(y - bounds.top) <= handleSize) {
          return "top-right";
        }

        if (Math.abs(x - bounds.left) <= handleSize && Math.abs(y - bounds.bottom) <= handleSize) {
          return "bottom-left";
        }

        if (Math.abs(x - bounds.right) <= handleSize && Math.abs(y - bounds.bottom) <= handleSize) {
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

      case "pencil":
        if (handle === "rotate") {
          this.rotatePencil(shape, x, y);
        } else {
          this.resizePencil(shape, x, y);
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

  private startPencilResize(pencil: Pencil, handle: CornerHandle): void {
    const bounds = this.scene.getPencilBounds(pencil);

    if (!bounds) return;

    const [anchorX, anchorY, handleX, handleY] =
      handle === "top-left"
        ? [bounds.right, bounds.bottom, bounds.left, bounds.top]
        : handle === "top-right"
          ? [bounds.left, bounds.bottom, bounds.right, bounds.top]
          : handle === "bottom-left"
            ? [bounds.right, bounds.top, bounds.left, bounds.bottom]
            : [bounds.left, bounds.top, bounds.right, bounds.bottom];

    this.pencilResizeState = {
      handle,
      anchorX,
      anchorY,
      startVectorX: handleX - anchorX,
      startVectorY: handleY - anchorY,
      startStrokeWidth: pencil.strokeWidth,
      startPoints: pencil.points.map((point) => ({ ...point })),
    };
  }

  private isPencilRotationHandle(x: number, y: number, pencil: Pencil): boolean {
    const bounds = this.scene.getPencilBounds(pencil);

    if (!bounds) return false;

    const centerX = (bounds.left + bounds.right) / 2;
    const rotationHandleY = bounds.top - PENCIL_ROTATION_HANDLE_OFFSET / this.editor.viewport.zoom;

    return (
      Math.hypot(x - centerX, y - rotationHandleY) <=
      PENCIL_ROTATION_HANDLE_RADIUS / this.editor.viewport.zoom
    );
  }

  private startPencilRotation(pencil: Pencil, x: number, y: number): void {
    const bounds = this.scene.getPencilBounds(pencil);

    if (!bounds) return;

    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;

    this.pencilRotationState = {
      centerX,
      centerY,
      startAngle: Math.atan2(y - centerY, x - centerX),
      startPoints: pencil.points.map((point) => ({ ...point })),
    };
  }

  private resizePencil(pencil: Pencil, x: number, y: number): void {
    const state = this.pencilResizeState;

    if (!state) return;

    const startLengthSquared = state.startVectorX ** 2 + state.startVectorY ** 2;

    if (startLengthSquared === 0) return;

    const minimumScale = Math.max(
      MIN_PENCIL_SCALE,
      MIN_PENCIL_STROKE_WIDTH / state.startStrokeWidth,
    );
    const scale = Math.max(
      minimumScale,
      ((x - state.anchorX) * state.startVectorX + (y - state.anchorY) * state.startVectorY) /
        startLengthSquared,
    );

    pencil.points = state.startPoints.map((point) => ({
      x: state.anchorX + (point.x - state.anchorX) * scale,
      y: state.anchorY + (point.y - state.anchorY) * scale,
    }));
    pencil.strokeWidth = state.startStrokeWidth * scale;
  }

  private rotatePencil(pencil: Pencil, x: number, y: number): void {
    const state = this.pencilRotationState;

    if (!state) return;

    const angle = Math.atan2(y - state.centerY, x - state.centerX) - state.startAngle;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    pencil.points = state.startPoints.map((point) => {
      const relativeX = point.x - state.centerX;
      const relativeY = point.y - state.centerY;

      return {
        x: state.centerX + relativeX * cos - relativeY * sin,
        y: state.centerY + relativeX * sin + relativeY * cos,
      };
    });
  }

  private getGroupResizeHandle(x: number, y: number): CornerHandle | null {
    const bounds = this.getGroupBounds();
    if (!bounds) return null;
    const size = 8 / this.editor.viewport.zoom;
    if (Math.abs(x - bounds.left) <= size && Math.abs(y - bounds.top) <= size) return "top-left";
    if (Math.abs(x - bounds.right) <= size && Math.abs(y - bounds.top) <= size) return "top-right";
    if (Math.abs(x - bounds.left) <= size && Math.abs(y - bounds.bottom) <= size)
      return "bottom-left";
    if (Math.abs(x - bounds.right) <= size && Math.abs(y - bounds.bottom) <= size)
      return "bottom-right";
    return null;
  }
  private getGroupBounds() {
    const bounds = this.editor.selectedShapes
      .map((shape) => this.scene.getShapeBounds(shape))
      .filter((bound): bound is NonNullable<typeof bound> => bound !== null);
    if (!bounds.length) return null;
    return {
      left: Math.min(...bounds.map((b) => b.left)),
      top: Math.min(...bounds.map((b) => b.top)),
      right: Math.max(...bounds.map((b) => b.right)),
      bottom: Math.max(...bounds.map((b) => b.bottom)),
    };
  }
  private startGroupResize(handle: CornerHandle) {
    const bounds = this.getGroupBounds();
    if (!bounds) return;
    const [anchorX, anchorY, handleX, handleY] =
      handle === "top-left"
        ? [bounds.right, bounds.bottom, bounds.left, bounds.top]
        : handle === "top-right"
          ? [bounds.left, bounds.bottom, bounds.right, bounds.top]
          : handle === "bottom-left"
            ? [bounds.right, bounds.top, bounds.left, bounds.bottom]
            : [bounds.left, bounds.top, bounds.right, bounds.bottom];
    this.groupResizeState = {
      anchorX,
      anchorY,
      vectorX: handleX - anchorX,
      vectorY: handleY - anchorY,
      shapes: JSON.parse(JSON.stringify(this.editor.selectedShapes)) as CanvasShape[],
    };
  }
  private resizeGroup(x: number, y: number) {
    const state = this.groupResizeState;
    if (!state) return;
    const length = state.vectorX ** 2 + state.vectorY ** 2;
    if (!length) return;
    const scale = Math.max(
      0.05,
      ((x - state.anchorX) * state.vectorX + (y - state.anchorY) * state.vectorY) / length,
    );
    this.editor.selectedShapes.forEach((shape, index) => {
      const source = state.shapes[index];
      const point = (px: number, py: number) => ({
        x: state.anchorX + (px - state.anchorX) * scale,
        y: state.anchorY + (py - state.anchorY) * scale,
      });
      switch (shape.type) {
        case "rectangle":
        case "ellipse": {
          if (source.type !== shape.type) return;
          const p = point(source.x, source.y);
          shape.x = p.x;
          shape.y = p.y;
          shape.width = source.width * scale;
          shape.height = source.height * scale;
          break;
        }
        case "line":
        case "arrow": {
          if (source.type !== shape.type) return;
          const a = point(source.x1, source.y1),
            b = point(source.x2, source.y2);
          shape.x1 = a.x;
          shape.y1 = a.y;
          shape.x2 = b.x;
          shape.y2 = b.y;
          break;
        }
        case "text": {
          if (source.type !== "text") return;
          const p = point(source.x, source.y);
          shape.x = p.x;
          shape.y = p.y;
          shape.fontSize = source.fontSize * scale;
          break;
        }
        case "pencil": {
          if (source.type !== "pencil") return;
          shape.points = source.points.map((p) => point(p.x, p.y));
          shape.strokeWidth = source.strokeWidth * scale;
          break;
        }
      }
    });
  }
}
export default SelectTool;
