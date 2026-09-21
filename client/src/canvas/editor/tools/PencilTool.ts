import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";
import type { Pencil } from "@/canvas/scene";

class PencilTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;

  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    // start a new pencil shape
    const pencil: Pencil = {
      id: crypto.randomUUID(),
      type: "pencil",
      points: [
        {
          x: event.x,
          y: event.y,
        },
      ],
      strokeColor: this.editor.strokeColor,
      strokeWidth: this.editor.strokeWidth,
    };

    this.scene.addShape(pencil);

    this.editor.startDrawing(pencil);
  }

  onMouseMove(event: CanvasPointerEvent): void {
    // add points
    const pencil = this.editor.currentShape;

    if (!pencil || pencil.type !== "pencil") return;

    pencil.points.push({
      x: event.x,
      y: event.y,
    });
  }

  onMouseUp(): void {
    // finish pencil shape
    this.editor.finishDrawing();
  }
}
export default PencilTool;
