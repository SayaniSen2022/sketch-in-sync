import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import type { ToolStrategy } from "./ToolStrategy";
import type { Text } from "@/canvas/scene";

class TextTool implements ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;

  constructor(scene: Scene, editor: EditorState) {
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    this.editor.startTextEditing(event.offsetX, event.offsetY);
  }

  onMouseMove(): void {}

  onMouseUp(): void {}

  private finishText() {
    const text = this.editor.textValue.trim();

    if (!text) {
      this.editor.finishTextEditing();
      return;
    }

    const textShape: Text = {
      id: crypto.randomUUID(),
      type: "text",
      x: this.editor.textX,
      y: this.editor.textY,
      text: this.editor.textValue,
      fontSize: 20,
      fontFamily: "Arial",
      fillColor: "#fff",
    };

    this.scene.addShape(textShape);
    this.editor.finishTextEditing();
  }
}
export default TextTool;
