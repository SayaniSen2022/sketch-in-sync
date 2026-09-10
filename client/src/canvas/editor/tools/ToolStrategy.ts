/**
 * Base class for canvas tools. Mouse handlers are abstract; tools override
 * what they need. `commitText` has a no-op default (virtual-style) so the
 * engine can finish in-progress work without knowing the concrete tool.
 */
export abstract class ToolStrategy {
  abstract onMouseDown(event: MouseEvent): void;
  abstract onMouseMove(event: MouseEvent): void;
  abstract onMouseUp(event: MouseEvent): void;

  /** No-op default; tools override when they handle double-click. */
  onDoubleClick(event: MouseEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    event;
  }

  /** Commits in-progress work (primarily used by the text tool). */
  commitText(): void {}
}
