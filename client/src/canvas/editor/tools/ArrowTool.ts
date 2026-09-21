import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";
import type { Arrow } from "@/canvas/scene";

class ArrowTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    const arrow: Arrow = {
      id: crypto.randomUUID(),
      type: "arrow",

      x1: event.x,
      y1: event.y,

      x2: event.x,
      y2: event.y,

      strokeColor: this.editor.strokeColor,
      strokeWidth: this.editor.strokeWidth,
    };

    this.scene.addShape(arrow);
    this.editor.startDrawing(arrow);
  }

  onMouseMove(event: CanvasPointerEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "arrow") return;

    shape.x2 = event.x;
    shape.y2 = event.y;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default ArrowTool;
