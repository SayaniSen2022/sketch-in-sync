import type { Shape } from "./Shape";

export interface Arrow extends Shape {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor: string;
  strokeWidth: number;
}
