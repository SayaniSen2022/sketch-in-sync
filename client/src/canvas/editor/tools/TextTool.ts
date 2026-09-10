import Scene from "@/canvas/scene/Scene";
import EditorState from "../EditorState";
import { ToolStrategy } from "./ToolStrategy";
import type { Text } from "@/canvas/scene";

class TextTool extends ToolStrategy {
  private readonly scene: Scene;
  private readonly editor: EditorState;

  constructor(scene: Scene, editor: EditorState) {
    super();
    this.scene = scene;
    this.editor = editor;
  }

  onMouseDown(event: MouseEvent): void {
    // Commit the in-progress draft, then start a fresh editing session here.
    this.commitText();
    this.editor.startTextEditing(event.offsetX, event.offsetY);
  }

  onMouseMove(): void {}

  onMouseUp(): void {}

  commitText() {
    if (!this.editor.textEditing) return;

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
      fontSize: this.editor.textFontSize,
      fontFamily: this.editor.textFontFamily,
      fillColor: "#fff",
    };

    this.scene.addShape(textShape);
    this.editor.finishTextEditing();
  }
}
export default TextTool;
