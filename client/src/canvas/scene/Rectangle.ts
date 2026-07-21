import type { Shape } from "./Shape";

export interface Rectangle extends Shape {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}
