import RectangleTool from "./editor/tools/RectangleTool";
import Scene from "./scene/Scene";
import CanvasRenderer from "./CanvasRenderer";
import EditorState from "./editor/EditorState";
import type { ToolStrategy } from "./editor/tools/ToolStrategy";
import type { Tool } from "./editor/Tool";
import type { CanvasShape } from "./scene";

import EllipseTool from "./editor/tools/EllipseTool";
import LineTool from "./editor/tools/LineTool";
import ArrowTool from "./editor/tools/ArrowTool";
import SelectTool from "./editor/tools/SelectTool";
import PencilTool from "./editor/tools/PencilTool";
import TextTool from "./editor/tools/TextTool";
import { clearStoredDocument, loadStoredDocument, saveStoredDocument } from "./scene/persistence";

const AUTOSAVE_DELAY_MS = 350;

class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;

  private scene = new Scene();
  private renderer!: CanvasRenderer;

  private editor = new EditorState();

  private tools!: Record<Tool, ToolStrategy>;
  private activeTool!: ToolStrategy;
  private saveTimer: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init() {
    this.ctx = this.canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Failed to get 2D rendering context.");
    }

    this.renderer = new CanvasRenderer(this.ctx);
    const storedDocument = loadStoredDocument();
    this.scene.replaceShapes(storedDocument.shapes);
    this.editor.setCanvasBackgroundColor(storedDocument.backgroundColor);

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

    this.render(false);
  }

  public setTool(tool: Tool) {
    const nextTool = this.tools[tool];

    if (!nextTool) {
      console.error(`Tool "${tool}" is not registered.`);
      return;
    }

    // Let the current tool finish in-progress work before switching away.
    this.activeTool.commitText();
    this.saveScene();

    this.editor.setTool(tool);
    this.activeTool = nextTool;
    this.render();
  }

  /**
   * Commits the active tool's in-progress work (e.g. the text draft), if any.
   */
  public finishTextEditing() {
    this.activeTool.commitText();
    this.saveScene();
  }

  public setStrokeColor(color: string) {
    this.getActiveShapes().forEach((shape) => {
      switch (shape.type) {
        case "rectangle":
        case "ellipse":
        case "line":
        case "arrow":
        case "pencil":
          shape.strokeColor = color;
          break;
      }
    });

    this.editor.setStrokeColor(color);
    this.saveScene();
  }

  public setStrokeWidth(width: number) {
    this.getActiveShapes().forEach((shape) => {
      switch (shape.type) {
        case "rectangle":
        case "ellipse":
        case "line":
        case "arrow":
        case "pencil":
          shape.strokeWidth = width;
          break;
      }
    });

    this.editor.setStrokeWidth(width);
    this.saveScene();
  }

  public setTextFontSize(size: number) {
    this.getActiveShapes().forEach((shape) => {
      if (shape.type === "text") shape.fontSize = size;
    });

    this.editor.setTextFontSize(size);

    if (!this.editor.textEditing) {
      this.saveScene();
    }
  }

  public setTextFontFamily(fontFamily: string) {
    this.getActiveShapes().forEach((shape) => {
      if (shape.type === "text") shape.fontFamily = fontFamily;
    });

    this.editor.setTextFontFamily(fontFamily);

    if (!this.editor.textEditing) {
      this.saveScene();
    }
  }

  public setCanvasBackgroundColor(color: string) {
    this.editor.setCanvasBackgroundColor(color);
    this.saveScene();
  }

  public clearCanvas() {
    this.activeTool.commitText();
    this.scene.clear();
    this.editor.clearSelection();
    this.editor.finishDrawing();
    this.editor.stopDragging();
    this.editor.stopResizing();
    this.render(false);
    this.cancelScheduledSave();
    clearStoredDocument();
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

    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    window.addEventListener("keydown", this.handleKeyDown);
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
    this.saveScene();
  };

  private handleDoubleClick = (event: MouseEvent) => {
    this.execute(() => {
      this.activeTool.onDoubleClick(event);
    });
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Delete" || event.target instanceof HTMLTextAreaElement) return;
    if (this.editor.selectedShapes.length === 0) return;
    event.preventDefault();
    this.scene.removeShapes(this.editor.selectedShapes);
    this.editor.clearSelection();
    this.render(false);
    this.saveScene();
  };

  private execute(action: () => void) {
    action();
    this.render();
  }

  private handleResize = () => {
    this.resizeCanvas();
    this.render(false);
  };

  public render(scheduleSave = true) {
    this.renderer.render(this.scene, this.editor);

    if (scheduleSave && !this.editor.textEditing) {
      this.scheduleSave();
    }
  }

  destroy() {
    this.activeTool.commitText();
    this.saveScene();

    window.removeEventListener("resize", this.handleResize);

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);

    this.canvas.removeEventListener("mousemove", this.handleMouseMove);

    window.removeEventListener("mouseup", this.handleMouseUp);

    this.canvas.removeEventListener("dblclick", this.handleDoubleClick);
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private scheduleSave() {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }

    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.saveScene();
    }, AUTOSAVE_DELAY_MS);
  }

  private saveScene() {
    this.cancelScheduledSave();

    saveStoredDocument(this.scene.getShapes(), this.editor.canvasBackgroundColor);
  }

  private getActiveShapes(): CanvasShape[] {
    return this.editor.currentShape ? [this.editor.currentShape] : this.editor.selectedShapes;
  }

  private cancelScheduledSave() {
    if (this.saveTimer === null) return;

    window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }
}

export default CanvasEngine;
