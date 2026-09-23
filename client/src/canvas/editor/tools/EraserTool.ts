import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy, type CanvasPointerEvent } from "./ToolStrategy";

class EraserTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;

  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: CanvasPointerEvent): void {
    const shape = this.scene.findShapeAt(event.x, event.y, 6 / this.editor.viewport.zoom);

    if (!shape) return;

    this.scene.removeShape(shape);

    if (this.editor.selectedShapes.includes(shape)) {
      this.editor.clearSelection();
    }
  }

  onMouseMove(): void {}

  onMouseUp(): void {}
}

export default EraserTool;
