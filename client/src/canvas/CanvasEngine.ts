import type { Rectangle } from "./scene";
import Scene from "./scene/Scene";

class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private scene = new Scene();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init() {
    this.ctx = this.canvas.getContext("2d"); // getting the CanvasRenderingContext2d

    // this may return CanvasRenderingContext2D | null. Theoretically a browser may fail to provide a 2D context.
    // So we use guard clause:
    if (!this.ctx) {
      throw new Error("Failed to get 2D rendering context.");
    }

    const rect: Rectangle = {
      id: crypto.randomUUID(),
      type: "rectangle",

      x: 50,
      y: 50,

      width: 200,
      height: 120,

      strokeColor: "#000",
      fillColor: "#ff0000",
      strokeWidth: 2,
    };

    this.scene.addShape(rect);
    this.resizeCanvas();
    this.attachEventListeners();
    this.render();
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  private attachEventListeners() {
    window.addEventListener("resize", this.handleResize);
  }
  private handleResize = () => {
    this.resizeCanvas();
    this.render();
  };

  private clearCanvas() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  private render() {
    if (!this.ctx) return;

    this.clearCanvas();

    const shapes = this.scene.getShapes();

    for (const shape of shapes) {
      switch (shape.type) {
        case "rectangle":
          shape.fillColor;
          shape.width;
          shape.height;
          break;
      }
    }
  }
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }
}

export default CanvasEngine;
