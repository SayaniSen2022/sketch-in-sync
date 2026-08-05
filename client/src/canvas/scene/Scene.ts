import type { CanvasShape } from "./types";

class Scene {
  private shapes: CanvasShape[] = [];

  getShapes() {
    return this.shapes;
  }

  addShape(shape: CanvasShape) {
    this.shapes.push(shape);
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
  clear() {
    this.shapes = [];
  }
}

export default Scene;
