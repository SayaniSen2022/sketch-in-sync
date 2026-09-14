import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy } from "./ToolStrategy";
import type { Arrow } from "@/canvas/scene";

class ArrowTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    const arrow: Arrow = {
      id: crypto.randomUUID(),
      type: "arrow",

      x1: event.offsetX,
      y1: event.offsetY,

      x2: event.offsetX,
      y2: event.offsetY,

      strokeColor: this.editor.strokeColor,
      strokeWidth: this.editor.strokeWidth,
    };

    this.scene.addShape(arrow);
    this.editor.startDrawing(arrow);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "arrow") return;

    shape.x2 = event.offsetX;
    shape.y2 = event.offsetY;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default ArrowTool;
