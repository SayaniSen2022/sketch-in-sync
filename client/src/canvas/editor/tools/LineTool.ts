import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import type { ToolStrategy } from "./ToolStrategy";
import type { Line } from "@/canvas/scene";

class LineTool implements ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    const line: Line = {
      id: crypto.randomUUID(),
      type: "line",

      x1: event.offsetX,
      y1: event.offsetY,

      x2: event.offsetX,
      y2: event.offsetY,

      strokeColor: "#000",
      strokeWidth: 2,
    };

    this.scene.addShape(line);
    this.editor.startDrawing(line);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "line") return;

    shape.x2 = event.offsetX;
    shape.y2 = event.offsetY;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default LineTool;
