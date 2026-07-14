class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
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
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  private render() {
    if (!this.ctx) return;
    this.clearCanvas();
    this.ctx.fillStyle = "rgb(200 0 0)";
    this.ctx.fillRect(10, 10, 50, 50);

    this.ctx.beginPath();
    this.ctx.moveTo(75, 50);
    this.ctx.lineTo(100, 75);
    this.ctx.lineTo(100, 25);
    this.ctx.fill();
    this.ctx.closePath();
  }
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }
}

export default CanvasEngine;
