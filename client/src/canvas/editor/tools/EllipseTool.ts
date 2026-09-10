import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy } from "./ToolStrategy";
import type { Ellipse } from "@/canvas/scene/Ellipse";

class EllipseTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    const ellipse: Ellipse = {
      id: crypto.randomUUID(),
      type: "ellipse",

      x: event.offsetX,
      y: event.offsetY,

      width: 0,
      height: 0,

      strokeColor: "#fff",
      fillColor: "transparent",
      strokeWidth: 2,
    };

    this.scene.addShape(ellipse);
    this.editor.startDrawing(ellipse);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.editor.isDrawing) return;

    const shape = this.editor.currentShape;

    if (!shape || shape.type !== "ellipse") return;

    shape.width = event.offsetX - shape.x;
    shape.height = event.offsetY - shape.y;
  }

  onMouseUp(): void {
    this.editor.finishDrawing();
  }
}

export default EllipseTool;
