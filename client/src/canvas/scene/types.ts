import type { Rectangle } from "./Rectangle";
import type { Ellipse } from "./Ellipse";
import type { Line } from "./Line";
import type { Arrow } from "./Arrow";

export type ShapeType = "rectangle" | "ellipse" | "line" | "arrow" | "text" | "image" | "freehand";

export type CanvasShape = Rectangle | Ellipse | Line | Arrow;
