import type { CanvasShape } from "./types";
import type { Text } from "./Text";
import type { Pencil } from "./Pencil";

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

  getPencilBounds(
    pencil: Pencil,
  ): { left: number; top: number; right: number; bottom: number } | null {
    if (pencil.points.length === 0) return null;

    const firstPoint = pencil.points[0];
    let left = firstPoint.x;
    let right = firstPoint.x;
    let top = firstPoint.y;
    let bottom = firstPoint.y;

    for (let i = 1; i < pencil.points.length; i++) {
      const point = pencil.points[i];
      left = Math.min(left, point.x);
      right = Math.max(right, point.x);
      top = Math.min(top, point.y);
      bottom = Math.max(bottom, point.y);
    }

    const strokeInset = pencil.strokeWidth / 2;

    return {
      left: left - strokeInset,
      top: top - strokeInset,
      right: right + strokeInset,
      bottom: bottom + strokeInset,
    };
  }

  getShapes() {
    return this.shapes;
  }

  getShapeBounds(
    shape: CanvasShape,
  ): { left: number; top: number; right: number; bottom: number } | null {
    switch (shape.type) {
      case "rectangle":
      case "ellipse":
        return {
          left: Math.min(shape.x, shape.x + shape.width),
          top: Math.min(shape.y, shape.y + shape.height),
          right: Math.max(shape.x, shape.x + shape.width),
          bottom: Math.max(shape.y, shape.y + shape.height),
        };
      case "line":
      case "arrow":
        return {
          left: Math.min(shape.x1, shape.x2),
          top: Math.min(shape.y1, shape.y2),
          right: Math.max(shape.x1, shape.x2),
          bottom: Math.max(shape.y1, shape.y2),
        };
      case "text":
        return this.getTextBounds(shape);
      case "pencil":
        return this.getPencilBounds(shape);
    }
  }
  getShapesInBounds(left: number, top: number, right: number, bottom: number): CanvasShape[] {
    return this.shapes.filter((shape) => {
      const bounds = this.getShapeBounds(shape);
      return (
        !!bounds &&
        bounds.left >= left &&
        bounds.top >= top &&
        bounds.right <= right &&
        bounds.bottom <= bottom
      );
    });
  }

  replaceShapes(shapes: CanvasShape[]) {
    this.shapes = shapes;
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

  findShapeAt(x: number, y: number, tolerance = 6): CanvasShape | null {
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
          if (this.isPointNearLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2, tolerance)) {
            return shape;
          }

          break;
        }
        case "arrow": {
          if (this.isPointNearLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2, tolerance)) {
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
        case "pencil": {
          if (this.isPointNearPencil(x, y, shape, tolerance)) {
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
  private isPointNearPencil(px: number, py: number, pencil: Pencil, tolerance: number): boolean {
    const hitTolerance = Math.max(tolerance, pencil.strokeWidth / 2);

    if (pencil.points.length === 0) return false;

    if (pencil.points.length === 1) {
      const point = pencil.points[0];
      return Math.hypot(px - point.x, py - point.y) <= hitTolerance;
    }

    for (let i = 1; i < pencil.points.length; i++) {
      const start = pencil.points[i - 1];
      const end = pencil.points[i];

      if (this.isPointNearLine(px, py, start.x, start.y, end.x, end.y, hitTolerance)) {
        return true;
      }
    }

    return false;
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
  removeShapes(shapes: CanvasShape[]) {
    const selected = new Set(shapes);
    this.shapes = this.shapes.filter((shape) => !selected.has(shape));
  }
  clear() {
    this.shapes = [];
  }
}

export default Scene;
