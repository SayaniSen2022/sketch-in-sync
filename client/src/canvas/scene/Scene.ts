import type { CanvasShape } from "./types";

class Scene {
  private shapes: CanvasShape[] = [];

  getShapes() {
    return this.shapes;
  }

  addShape(shape: CanvasShape) {
    this.shapes.push(shape);
  }
  clear() {
    this.shapes = [];
  }
}

export default Scene;
