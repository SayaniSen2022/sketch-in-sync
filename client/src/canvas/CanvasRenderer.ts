import type { Rectangle } from "./scene";
import type { Ellipse } from "./scene/Ellipse";
import type { Line } from "./scene";
import type { Arrow } from "./scene";
import Scene from "./scene/Scene";

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  render(scene: Scene): void {
    this.clearCanvas();

    const shapes = scene.getShapes();
    for (const shape of shapes) {
      switch (shape.type) {
        case "rectangle":
          this.drawRectangle(shape);
          break;
        case "ellipse":
          this.drawEllipse(shape);
          break;
        case "line":
          this.drawLine(shape);
          break;
        case "arrow":
          this.drawArrow(shape);
          break;
      }
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  private drawRectangle(rect: Rectangle): void {
    this.ctx.fillStyle = rect.fillColor;
    this.ctx.strokeStyle = rect.strokeColor;
    this.ctx.lineWidth = rect.strokeWidth;

    this.ctx.beginPath();
    this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath();
  }
  private drawEllipse(ellipse: Ellipse): void {
    this.ctx.fillStyle = ellipse.fillColor;
    this.ctx.strokeStyle = ellipse.strokeColor;
    this.ctx.lineWidth = ellipse.strokeWidth;

    this.ctx.beginPath();
    this.ctx.ellipse(
      ellipse.x + ellipse.width / 2,
      ellipse.y + ellipse.height / 2,
      Math.abs(ellipse.width) / 2,
      Math.abs(ellipse.height) / 2,
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath();
  }
  private drawLine(line: Line): void {
    this.ctx.strokeStyle = line.strokeColor;
    this.ctx.lineWidth = line.strokeWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(line.x1, line.y1);
    this.ctx.lineTo(line.x2, line.y2);
    this.ctx.stroke();
    this.ctx.closePath();
  }
  private drawArrow(arrow: Arrow): void {
    const length = Math.hypot(arrow.x2 - arrow.x1, arrow.y2 - arrow.y1);

    if (length < 2) return;

    this.ctx.strokeStyle = arrow.strokeColor;
    this.ctx.lineWidth = arrow.strokeWidth;

    const headLength = arrow.strokeWidth * 6;
    const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1);

    this.ctx.beginPath();

    // shaft
    this.ctx.moveTo(arrow.x1, arrow.y1);
    this.ctx.lineTo(arrow.x2, arrow.y2);

    // left wing
    this.ctx.moveTo(arrow.x2, arrow.y2);
    this.ctx.lineTo(
      arrow.x2 - headLength * Math.cos(angle - Math.PI / 6),
      arrow.y2 - headLength * Math.sin(angle - Math.PI / 6),
    );

    // right wing
    this.ctx.moveTo(arrow.x2, arrow.y2);
    this.ctx.lineTo(
      arrow.x2 - headLength * Math.cos(angle + Math.PI / 6),
      arrow.y2 - headLength * Math.sin(angle + Math.PI / 6),
    );

    this.ctx.stroke();
    this.ctx.closePath();
  }
}
export default CanvasRenderer;
