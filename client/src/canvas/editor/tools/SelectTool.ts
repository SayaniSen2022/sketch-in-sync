import type { ToolStrategy } from "./ToolStrategy";
import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";

class SelectTool implements ToolStrategy {
  private scene: Scene;
  private editor: EditorState;
  constructor(scene: Scene, editor: EditorState) {
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    const x = event.offsetX;
    const y = event.offsetY;
    const shape = this.scene.findShapeAt(x, y);
    this.editor.setSelectedShape(shape);
    if (shape) {
      this.editor.startDragging(x, y);
    }
    // console.log(shape);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.editor.isDragging) return;
    const shape = this.editor.selectedShape;
    if (!shape) return;
    const x = event.offsetX;
    const y = event.offsetY;

    const dx = x - this.editor.dragOffsetX;
    const dy = y - this.editor.dragOffsetY;

    this.scene.moveShape(shape, dx, dy);

    this.editor.dragOffsetX = x;
    this.editor.dragOffsetY = y;
  }

  onMouseUp(): void {
    this.editor.stopDragging();
  }
}
export default SelectTool;
