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
        this.drawDashedRectangle(shape);
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
  private drawDashedRectangle(dashedRect: Rectangle): void {
    this.ctx.save();

    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const left = Math.min(dashedRect.x, dashedRect.x + dashedRect.width);
    const top = Math.min(dashedRect.y, dashedRect.y + dashedRect.height);

    this.ctx.strokeRect(left, top, Math.abs(dashedRect.width), Math.abs(dashedRect.height));

    this.ctx.restore();
  }
  private drawEllipseSelection(ellipse: Ellipse): void {
    this.ctx.save();

    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const left = Math.min(ellipse.x, ellipse.x + ellipse.width);
    const top = Math.min(ellipse.y, ellipse.y + ellipse.height);

    this.ctx.strokeRect(left, top, Math.abs(ellipse.width), Math.abs(ellipse.height));

    this.ctx.restore();
  }
  private drawHandle(x: number, y: number, filled = false): void {
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

    this.drawHandle(line.x1, line.y1);
    this.drawHandle(midX, midY, true);
    this.drawHandle(line.x2, line.y2);
  }
  private drawArrowSelection(arrow: Arrow): void {
    const midX = (arrow.x1 + arrow.x2) / 2;
    const midY = (arrow.y1 + arrow.y2) / 2;

    this.drawHandle(arrow.x1, arrow.y1);
    this.drawHandle(midX, midY, true);
    this.drawHandle(arrow.x2, arrow.y2);
  }
}
export default CanvasRenderer;
