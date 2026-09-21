import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";
import type { Rectangle } from "@/canvas/scene";

class RectangleTool extends ToolStrategy {
  private scene: Scene;
  private editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    const rect: Rectangle = {
      id: crypto.randomUUID(),
      type: "rectangle",

      x: event.x,
      y: event.y,

      width: 0,
      height: 0,

      strokeColor: this.editor.strokeColor,
      fillColor: "transparent",
      strokeWidth: this.editor.strokeWidth,
    };

    this.scene.addShape(rect);
    this.editor.startDrawing(rect);
  }

  onMouseMove(event: CanvasPointerEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "rectangle") return;
    shape.width = event.x - shape.x;
    shape.height = event.y - shape.y;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default RectangleTool;
