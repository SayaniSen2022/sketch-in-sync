import type { CanvasShape } from "./types";
import type { Text } from "./Text";

const measureContext = document.createElement("canvas").getContext("2d");

class Scene {
  private shapes: CanvasShape[] = [];

  /**
   * Text shapes have no stored width/height; bounds are measured from the
   * font and longest line. Line height matches the renderer (fontSize).
   */
  getTextBounds(text: Text): { left: number; top: number; right: number; bottom: number } {
    const lines = text.text.split("\n");
    let width = 0;

    if (measureContext) {
      measureContext.font = `${text.fontSize}px ${text.fontFamily}`;
      width = Math.max(0, ...lines.map((line) => measureContext.measureText(line).width));
    }

    return {
      left: text.x,
      top: text.y,
      right: text.x + width,
      bottom: text.y + lines.length * text.fontSize,
    };
  }

  getShapes() {
    return this.shapes;
  }

  addShape(shape: CanvasShape) {
    this.shapes.push(shape);
  }

  /**
   * Maps a point inside a text shape to a caret index in its string: the line
   * comes from y, the character from the nearest measured x midpoint.
   */
  getTextCaretIndex(text: Text, px: number, py: number): number {
    const lines = text.text.split("\n");
    const lineIndex = Math.max(
      0,
      Math.min(lines.length - 1, Math.floor((py - text.y) / text.fontSize)),
    );
    const line = lines[lineIndex];

    let column = line.length;

    if (measureContext) {
      measureContext.font = `${text.fontSize}px ${text.fontFamily}`;

      const relativeX = px - text.x;
      column = 0;

      for (let i = 0; i < line.length; i++) {
        const left = measureContext.measureText(line.slice(0, i)).width;
        const right = measureContext.measureText(line.slice(0, i + 1)).width;

        if (relativeX < (left + right) / 2) {
          column = i;
          break;
        }

        column = i + 1;
      }
    }

    let index = column;

    for (let i = 0; i < lineIndex; i++) {
      index += lines[i].length + 1; // +1 for the newline
    }

    return index;
  }

  findShapeAt(x: number, y: number): CanvasShape | null {
    // selection delete resize duplicate context menu
    const shapes = this.shapes;

    //iterate backwards so the topmost is selcted first
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      switch (shape.type) {
        case "rectangle": {
          const left = Math.min(shape.x, shape.x + shape.width);
          const right = Math.max(shape.x, shape.x + shape.width);
          const top = Math.min(shape.y, shape.y + shape.height);
          const bottom = Math.max(shape.y, shape.y + shape.height);

          if (x >= left && x <= right && y >= top && y <= bottom) {
            return shape;
          }

          break;
        }
        case "ellipse": {
          const rx = Math.abs(shape.width) / 2;
          const ry = Math.abs(shape.height) / 2;

          if (rx === 0 || ry === 0) break;

          const cx = shape.x + shape.width / 2;
          const cy = shape.y + shape.height / 2;

          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;

          if (dx * dx + dy * dy <= 1) {
            return shape;
          }

          break;
        }
        case "line": {
          if (this.isPointNearLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2)) {
            return shape;
          }

          break;
        }
        case "arrow": {
          if (this.isPointNearLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2)) {
            return shape;
          }

          break;
        }
        case "text": {
          const bounds = this.getTextBounds(shape);

          if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
            return shape;
          }

          break;
        }
      }
    }
    return null;
  }
  private isPointNearLine(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tolerance = 6,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.hypot(px - x1, py - y1) <= tolerance;
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;

    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return Math.hypot(px - nearestX, py - nearestY) <= tolerance;
  }
  moveShape(shape: CanvasShape, dx: number, dy: number) {
    switch (shape.type) {
      case "rectangle":
        shape.x += dx;
        shape.y += dy;
        break;

      case "ellipse":
        shape.x += dx;
        shape.y += dy;
        break;

      case "line":
        shape.x1 += dx;
        shape.y1 += dy;
        shape.x2 += dx;
        shape.y2 += dy;
        break;

      case "arrow":
        shape.x1 += dx;
        shape.y1 += dy;
        shape.x2 += dx;
        shape.y2 += dy;
        break;

      case "pencil":
        shape.points.forEach((point) => {
          point.x += dx;
          point.y += dy;
        });
        break;

      case "text":
        shape.x += dx;
        shape.y += dy;
        break;
    }
  }
  removeShape(shape: CanvasShape) {
    this.shapes = this.shapes.filter((existing) => existing !== shape);
  }
  clear() {
    this.shapes = [];
  }
}

export default Scene;
