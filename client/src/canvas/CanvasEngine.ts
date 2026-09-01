import RectangleTool from "./editor/tools/RectangleTool";
import Scene from "./scene/Scene";
import CanvasRenderer from "./CanvasRenderer";
import EditorState from "./editor/EditorState";
import type { ToolStrategy } from "./editor/tools/ToolStrategy";
import type { Tool } from "./editor/Tool";

import EllipseTool from "./editor/tools/EllipseTool";
import LineTool from "./editor/tools/LineTool";
import ArrowTool from "./editor/tools/ArrowTool";
import SelectTool from "./editor/tools/SelectTool";
import PencilTool from "./editor/tools/PencilTool";
import TextTool from "./editor/tools/TextTool";

class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;

  private scene = new Scene();
  private renderer!: CanvasRenderer;

  private editor = new EditorState();

  private tools!: Record<Tool, ToolStrategy>;
  private activeTool!: ToolStrategy;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init() {
    this.ctx = this.canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Failed to get 2D rendering context.");
    }

    this.renderer = new CanvasRenderer(this.ctx);

    this.tools = {
      rectangle: new RectangleTool(this.scene, this.editor),

      ellipse: new EllipseTool(this.scene, this.editor),

      line: new LineTool(this.scene, this.editor),

      arrow: new ArrowTool(this.scene, this.editor),

      pencil: new PencilTool(this.scene, this.editor),

      text: new TextTool(this.scene, this.editor),

      select: new SelectTool(this.scene, this.editor),
    };

    this.activeTool = this.tools[this.editor.currentTool];

    this.resizeCanvas();
    this.attachEventListeners();

    this.render();
  }

  public setTool(tool: Tool) {
    const nextTool = this.tools[tool];

    if (!nextTool) {
      console.error(`Tool "${tool}" is not registered.`);
      return;
    }

    this.editor.setTool(tool);
    this.activeTool = nextTool;
  }

  /**
   * Gives React/UI access to the editor state.
   */
  public getEditor(): EditorState {
    return this.editor;
  }

  /**
   * Optional: gives access to the scene if needed later.
  
  public getScene(): Scene {
    return this.scene;
  } */

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private attachEventListeners() {
    window.addEventListener("resize", this.handleResize);

    this.canvas.addEventListener("mousedown", this.handleMouseDown);

    this.canvas.addEventListener("mousemove", this.handleMouseMove);

    window.addEventListener("mouseup", this.handleMouseUp);
  }

  private handleMouseDown = (event: MouseEvent) => {
    this.execute(() => {
      this.activeTool.onMouseDown(event);
    });
  };

  private handleMouseMove = (event: MouseEvent) => {
    this.execute(() => {
      this.activeTool.onMouseMove(event);
    });
  };

  private handleMouseUp = (event: MouseEvent) => {
    this.execute(() => {
      this.activeTool.onMouseUp(event);
    });
  };

  private execute(action: () => void) {
    action();
    this.render();
  }

  private handleResize = () => {
    this.resizeCanvas();
    this.render();
  };

  private render() {
    this.renderer.render(this.scene, this.editor);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);

    this.canvas.removeEventListener("mousemove", this.handleMouseMove);

    window.removeEventListener("mouseup", this.handleMouseUp);
  }
}

export default CanvasEngine;
