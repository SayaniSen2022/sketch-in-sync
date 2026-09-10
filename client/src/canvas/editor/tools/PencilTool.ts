import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy } from "./ToolStrategy";
import type { Pencil } from "@/canvas/scene";

class PencilTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;

  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    // start a new pencil shape
    const pencil: Pencil = {
      id: crypto.randomUUID(),
      type: "pencil",
      points: [
        {
          x: event.offsetX,
          y: event.offsetY,
        },
      ],
      strokeColor: "#fff",
      strokeWidth: 2,
    };

    this.scene.addShape(pencil);

    this.editor.startDrawing(pencil);
  }

  onMouseMove(event: MouseEvent): void {
    // add points
    const pencil = this.editor.currentShape;

    if (!pencil || pencil.type !== "pencil") return;

    pencil.points.push({
      x: event.offsetX,
      y: event.offsetY,
    });
  }

  onMouseUp(): void {
    // finish pencil shape
    this.editor.finishDrawing();
  }
}
export default PencilTool;
