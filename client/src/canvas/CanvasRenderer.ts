import type { CanvasShape, Rectangle } from "./scene";
import type { Ellipse } from "./scene/Ellipse";
import type { Line } from "./scene";
import type { Arrow } from "./scene";
import type { Pencil } from "./scene";
import type { Text } from "./scene";
import Scene from "./scene/Scene";
import type EditorState from "./editor/EditorState";
import type { Viewport } from "./viewport";

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private scene: Scene | null = null;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  render(scene: Scene, editor: EditorState, viewport: Viewport): void {
    this.scene = scene;
    this.clearCanvas();
    this.ctx.save();
    this.ctx.translate(viewport.offsetX, viewport.offsetY);
    this.ctx.scale(viewport.zoom, viewport.zoom);

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
        case "pencil":
          this.drawPencil(shape);
          break;

        case "text":
          this.drawText(shape);
          break;
      }
      if (editor.selectedShapes.length === 1 && shape === editor.selectedShape) {
        this.drawSelection(shape, viewport.zoom);
      }
    }
    if (editor.selectedShapes.length > 1)
      this.drawGroupSelection(editor.selectedShapes, viewport.zoom);
    if (editor.isMarqueeSelecting) this.drawMarquee(editor, viewport.zoom);
    this.ctx.restore();
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

  private drawSelection(shape: CanvasShape, zoom: number): void {
    switch (shape.type) {
      case "rectangle":
        this.drawRectangleSelection(shape, zoom);
        break;

      case "ellipse":
        this.drawEllipseSelection(shape, zoom);
        break;

      case "line":
        this.drawLineSelection(shape, zoom);
        break;

      case "arrow":
        this.drawArrowSelection(shape, zoom);
        break;

      case "text":
        this.drawTextSelection(shape, zoom);
        break;

      case "pencil":
        this.drawPencilSelection(shape, zoom);
        break;
    }
  }
  private drawTextSelection(text: Text, zoom: number): void {
    if (!this.scene) return;

    const bounds = this.scene.getTextBounds(text);

    this.drawSelectionBox(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top,
      zoom,
    );
  }
  private drawSelectionBox(
    left: number,
    top: number,
    width: number,
    height: number,
    zoom: number,
  ): void {
    this.ctx.save();

    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.setLineDash([]);

    this.ctx.strokeRect(left, top, width, height);

    this.drawHandle(left, top, zoom);
    this.drawHandle(left + width, top, zoom);
    this.drawHandle(left, top + height, zoom);
    this.drawHandle(left + width, top + height, zoom);

    this.ctx.restore();
  }
  private drawGroupSelection(shapes: CanvasShape[], zoom: number): void {
    if (!this.scene) return;
    const bounds = shapes
      .map((shape) => this.scene?.getShapeBounds(shape))
      .filter((bound): bound is NonNullable<typeof bound> => bound !== null && bound !== undefined);
    if (!bounds.length) return;
    const left = Math.min(...bounds.map((bound) => bound.left));
    const top = Math.min(...bounds.map((bound) => bound.top));
    const right = Math.max(...bounds.map((bound) => bound.right));
    const bottom = Math.max(...bounds.map((bound) => bound.bottom));
    this.drawSelectionBox(left, top, right - left, bottom - top, zoom);
  }
  private drawMarquee(editor: EditorState, zoom: number): void {
    const left = Math.min(editor.marqueeStartX, editor.marqueeEndX);
    const top = Math.min(editor.marqueeStartY, editor.marqueeEndY);
    this.ctx.save();
    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.setLineDash([6 / zoom, 4 / zoom]);
    this.ctx.strokeRect(
      left,
      top,
      Math.abs(editor.marqueeEndX - editor.marqueeStartX),
      Math.abs(editor.marqueeEndY - editor.marqueeStartY),
    );
    this.ctx.restore();
  }
  private drawHandle(x: number, y: number, zoom: number): void {
    const size = 8 / zoom;

    this.ctx.beginPath();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#4EA8FF";
    this.ctx.lineWidth = 2 / zoom;

    this.ctx.rect(x - size / 2, y - size / 2, size, size);

    this.ctx.fill();
    this.ctx.stroke();
  }
  private drawRectangleSelection(rect: Rectangle, zoom: number): void {
    const left = Math.min(rect.x, rect.x + rect.width);
    const top = Math.min(rect.y, rect.y + rect.height);

    this.drawSelectionBox(left, top, Math.abs(rect.width), Math.abs(rect.height), zoom);
  }
  private drawEllipseSelection(ellipse: Ellipse, zoom: number): void {
    const left = Math.min(ellipse.x, ellipse.x + ellipse.width);
    const top = Math.min(ellipse.y, ellipse.y + ellipse.height);

    this.drawSelectionBox(left, top, Math.abs(ellipse.width), Math.abs(ellipse.height), zoom);
  }
  private drawPencilSelection(pencil: Pencil, zoom: number): void {
    if (!this.scene) return;

    const bounds = this.scene.getPencilBounds(pencil);

    if (!bounds) return;

    this.drawSelectionBox(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top,
      zoom,
    );

    const centerX = (bounds.left + bounds.right) / 2;
    const rotationHandleY = bounds.top - 24 / zoom;

    this.ctx.save();
    this.ctx.strokeStyle = "#8B7CFF";
    this.ctx.lineWidth = 2 / zoom;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, bounds.top);
    this.ctx.lineTo(centerX, rotationHandleY);
    this.ctx.stroke();
    this.ctx.restore();

    this.drawLineHandle(centerX, rotationHandleY, true, zoom);
  }
  private drawLineHandle(x: number, y: number, filled = false, zoom = 1): void {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 7 / zoom, 0, Math.PI * 2);

    this.ctx.lineWidth = 2 / zoom;
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
  private drawLineSelection(line: Line, zoom: number): void {
    const midX = (line.x1 + line.x2) / 2;
    const midY = (line.y1 + line.y2) / 2;

    this.drawLineHandle(line.x1, line.y1, false, zoom);
    this.drawLineHandle(midX, midY, true, zoom);
    this.drawLineHandle(line.x2, line.y2, false, zoom);
  }
  private drawArrowSelection(arrow: Arrow, zoom: number): void {
    const midX = (arrow.x1 + arrow.x2) / 2;
    const midY = (arrow.y1 + arrow.y2) / 2;

    this.drawLineHandle(arrow.x1, arrow.y1, false, zoom);
    this.drawLineHandle(midX, midY, true, zoom);
    this.drawLineHandle(arrow.x2, arrow.y2, false, zoom);
  }
  private drawPencil(pencil: Pencil): void {
    if (pencil.points.length < 2) return;

    this.ctx.strokeStyle = pencil.strokeColor;
    this.ctx.lineWidth = pencil.strokeWidth;

    this.ctx.beginPath();

    this.ctx.moveTo(pencil.points[0].x, pencil.points[0].y);

    for (let i = 1; i < pencil.points.length; i++) {
      this.ctx.lineTo(pencil.points[i].x, pencil.points[i].y);
    }

    this.ctx.stroke();
    this.ctx.closePath();
  }
  private drawTextLines(text: string, x: number, y: number, lineHeight: number): void {
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }
  private drawText(text: Text): void {
    this.ctx.save();
    this.ctx.fillStyle = text.fillColor;

    this.ctx.font = `${text.fontSize}px ${text.fontFamily}`;

    this.ctx.textBaseline = "top";

    this.drawTextLines(text.text, text.x, text.y, text.fontSize);
    this.ctx.restore();
  }
}
export default CanvasRenderer;
