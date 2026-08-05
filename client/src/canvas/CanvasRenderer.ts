import type { CanvasShape, Rectangle } from "./scene";
import type { Ellipse } from "./scene/Ellipse";
import type { Line } from "./scene";
import type { Arrow } from "./scene";
import Scene from "./scene/Scene";
import type EditorState from "./editor/EditorState";

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  render(scene: Scene, editor: EditorState): void {
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
      if (shape === editor.selectedShape) {
        this.drawSelection(shape);
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

  private drawSelection(shape: CanvasShape): void {
    switch (shape.type) {
      case "rectangle":
        this.drawRectangleSelection(shape);
        break;

      case "ellipse":
        this.drawEllipseSelection(shape);
        break;

      case "line":
        this.drawLineSelection(shape);
        break;

      case "arrow":
        this.drawArrowSelection(shape);
        break;
    }
  }
  private drawSelectionBox(left: number, top: number, width: number, height: number): void {
    this.ctx.save();

    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);

    this.ctx.strokeRect(left, top, width, height);

    this.drawHandle(left, top);
    this.drawHandle(left + width, top);
    this.drawHandle(left, top + height);
    this.drawHandle(left + width, top + height);

    this.ctx.restore();
  }
  private drawHandle(x: number, y: number): void {
    const size = 8;

    this.ctx.beginPath();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 2;

    this.ctx.rect(x - size / 2, y - size / 2, size, size);

    this.ctx.fill();
    this.ctx.stroke();
  }
  private drawRectangleSelection(rect: Rectangle): void {
    const left = Math.min(rect.x, rect.x + rect.width);
    const top = Math.min(rect.y, rect.y + rect.height);

    this.drawSelectionBox(left, top, Math.abs(rect.width), Math.abs(rect.height));
  }
  private drawEllipseSelection(ellipse: Ellipse): void {
    const left = Math.min(ellipse.x, ellipse.x + ellipse.width);
    const top = Math.min(ellipse.y, ellipse.y + ellipse.height);

    this.drawSelectionBox(left, top, Math.abs(ellipse.width), Math.abs(ellipse.height));
  }
  private drawLineHandle(x: number, y: number, filled = false): void {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 7, 0, Math.PI * 2);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#8B7CFF";

    if (filled) {
      this.ctx.fillStyle = "#6C5CE7";
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = "#1b1b1b"; // or your canvas background
      this.ctx.fill();
    }

    this.ctx.stroke();
    this.ctx.restore();
  }
  private drawLineSelection(line: Line): void {
    const midX = (line.x1 + line.x2) / 2;
    const midY = (line.y1 + line.y2) / 2;

    this.drawLineHandle(line.x1, line.y1);
    this.drawLineHandle(midX, midY, true);
    this.drawLineHandle(line.x2, line.y2);
  }
  private drawArrowSelection(arrow: Arrow): void {
    const midX = (arrow.x1 + arrow.x2) / 2;
    const midY = (arrow.y1 + arrow.y2) / 2;

    this.drawLineHandle(arrow.x1, arrow.y1);
    this.drawLineHandle(midX, midY, true);
    this.drawLineHandle(arrow.x2, arrow.y2);
  }
}
export default CanvasRenderer;
