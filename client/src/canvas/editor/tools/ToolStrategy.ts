/**
 * Base class for canvas tools. Mouse handlers are abstract; tools override
 * what they need. `commitText` has a no-op default (virtual-style) so the
 * engine can finish in-progress work without knowing the concrete tool.
 */
export interface CanvasPointerEvent {
  x: number;
  y: number;
  shiftKey: boolean;
}

export abstract class ToolStrategy {
  abstract onMouseDown(event: CanvasPointerEvent): void;
  abstract onMouseMove(event: CanvasPointerEvent): void;
  abstract onMouseUp(event: CanvasPointerEvent): void;

  /** No-op default; tools override when they handle double-click. */
  onDoubleClick(event: CanvasPointerEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    event;
  }

  /** Returns the cursor to display while hovering this tool's canvas affordances. */
  getCursor(event: CanvasPointerEvent): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    event;
    return "default";
  }

  /** Commits in-progress work (primarily used by the text tool). */
  commitText(): CanvasShape | null {
    return null;
  }
}
import type { CanvasShape } from "@/canvas/scene";
