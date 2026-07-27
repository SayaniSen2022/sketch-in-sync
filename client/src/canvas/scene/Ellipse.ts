import type { Shape } from "./Shape";

export interface Ellipse extends Shape {
  type: "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}
