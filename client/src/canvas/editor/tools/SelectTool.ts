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
    const shape = this.scene.findShapeAt(event.offsetX, event.offsetY);
    this.editor.setSelectedShape(shape);
    console.log(shape);
  }

  onMouseMove(event: MouseEvent): void {}

  onMouseUp(): void {}
}
export default SelectTool;
