import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";
import type { Ellipse } from "@/canvas/scene/Ellipse";

class EllipseTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    const ellipse: Ellipse = {
      id: crypto.randomUUID(),
      type: "ellipse",

      x: event.x,
      y: event.y,

      width: 0,
      height: 0,

      strokeColor: this.editor.strokeColor,
      fillColor: "transparent",
      strokeWidth: this.editor.strokeWidth,
    };

    this.scene.addShape(ellipse);
    this.editor.startDrawing(ellipse);
  }

  onMouseMove(event: CanvasPointerEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "ellipse") return;

    shape.width = event.x - shape.x;
    shape.height = event.y - shape.y;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default EllipseTool;
