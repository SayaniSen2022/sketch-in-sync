import type { Rectangle } from "./Rectangle";
import type { Ellipse } from "./Ellipse";
import type { Line } from "./Line";
import type { Arrow } from "./Arrow";
import type { Text } from "./Text";
import type { Pencil } from "./Pencil";

export type ShapeType = "rectangle" | "ellipse" | "line" | "arrow" | "text" | "pencil";

export type CanvasShape = Rectangle | Ellipse | Line | Arrow | Text | Pencil;
