import type { MouseEvent } from "react";
import type EditorState from "@/canvas/editor/EditorState";
import { FONT_FAMILIES, STROKE_COLORS, STROKE_WIDTHS, TEXT_SIZES } from "@/canvas/stylePresets";

type StyleSidebarProps = {
  editor: EditorState | null;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onTextFontSizeChange: (size: number) => void;
  onTextFontFamilyChange: (fontFamily: string) => void;
};

export default function StyleSidebar({
  editor,
  onStrokeColorChange,
  onStrokeWidthChange,
  onTextFontSizeChange,
  onTextFontFamilyChange,
}: StyleSidebarProps) {
  const preserveTextFocus = (event: MouseEvent<HTMLButtonElement>) => {
    if (editor?.textEditing) event.preventDefault();
  };
  const currentTool = editor?.currentTool;
  const selectedShape = editor?.selectedShape;
  const isTextStyleTarget =
    currentTool === "text" || (currentTool === "select" && selectedShape?.type === "text");
  const isShapeStyleTarget =
    ["rectangle", "ellipse", "line", "arrow", "pencil"].includes(currentTool ?? "") ||
    (currentTool === "select" &&
      selectedShape !== null &&
      selectedShape !== undefined &&
      selectedShape.type !== "text");

  if (!isTextStyleTarget && !isShapeStyleTarget) return null;

  return (
    <aside className="absolute z-100 top-1/2 left-3 max-h-[calc(100vh-1.5rem)] w-auto -translate-y-1/2 overflow-y-auto rounded-lg border border-white/10 bg-neutral-800 p-3 text-white shadow-xl">
      {(isTextStyleTarget || isShapeStyleTarget) && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-300">
            {isTextStyleTarget ? "Text color" : "Stroke color"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                aria-label={`Set ${isTextStyleTarget ? "text" : "stroke"} color to ${color}`}
                className={`h-6 w-6 rounded-full border-2 ${
                  editor?.strokeColor === color ? "border-cyan-400" : "border-white/30"
                }`}
                style={{ backgroundColor: color }}
                onMouseDown={preserveTextFocus}
                onClick={() => onStrokeColorChange(color)}
              />
            ))}
          </div>
        </section>
      )}

      {isShapeStyleTarget && (
        <section className="mt-4 border-t border-white/10 pt-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-300">
            Stroke width
          </h2>
          <div className="flex gap-2">
            {STROKE_WIDTHS.map((width) => (
              <button
                key={width}
                className={`rounded px-2 py-1 text-sm ${
                  editor?.strokeWidth === width ? "bg-cyan-500 text-neutral-950" : "bg-neutral-700"
                }`}
                onClick={() => onStrokeWidthChange(width)}
              >
                {width}
              </button>
            ))}
          </div>
        </section>
      )}

      {isTextStyleTarget && (
        <>
          <section className="mt-4 border-t border-white/10 pt-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-300">
              Text size
            </h2>
            <div className="flex gap-1">
              {TEXT_SIZES.map(({ label, value }) => (
                <button
                  key={label}
                  className={`rounded px-2 py-1 text-sm ${
                    editor?.textFontSize === value
                      ? "bg-cyan-500 text-neutral-950"
                      : "bg-neutral-700"
                  }`}
                  onClick={() => onTextFontSizeChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 border-t border-white/10 pt-3">
            <label
              htmlFor="font-family"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
            >
              Font family
            </label>
            <select
              id="font-family"
              value={editor?.textFontFamily ?? FONT_FAMILIES[0]}
              onChange={(event) => onTextFontFamilyChange(event.target.value)}
              className="w-full rounded bg-neutral-700 px-2 py-1 text-sm text-white"
            >
              {FONT_FAMILIES.map((fontFamily) => (
                <option key={fontFamily} value={fontFamily}>
                  {fontFamily}
                </option>
              ))}
            </select>
          </section>
        </>
      )}
    </aside>
  );
}
