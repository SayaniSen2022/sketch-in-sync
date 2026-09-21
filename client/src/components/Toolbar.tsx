import type { Tool } from "@/canvas/editor/Tool";
import "../index.css";

type ToolbarProps = {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClearCanvas: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

const TOOLS: { tool: Tool; label: string }[] = [
  { tool: "select", label: "Select" },
  { tool: "rectangle", label: "Rectangle" },
  { tool: "ellipse", label: "Ellipse" },
  { tool: "line", label: "Line" },
  { tool: "arrow", label: "Arrow" },
  { tool: "pencil", label: "Pencil" },
  { tool: "text", label: "Text" },
];

export default function Toolbar({
  currentTool,
  onToolChange,
  onClearCanvas,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ToolbarProps) {
  return (
    <nav className="absolute z-100 top-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/10 bg-neutral-800 p-2 text-white shadow-xl">
      <div className="flex items-center gap-1">
        {TOOLS.map(({ tool, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={currentTool === tool ? "active" : ""}
            style={{ cursor: "pointer", padding: "0 5px" }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center border-l border-white/20 pl-2">
        <button type="button" aria-label="Zoom out" onClick={onZoomOut}>
          −
        </button>
        <button type="button" onClick={onResetZoom} className="px-2 text-sm" title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" aria-label="Zoom in" onClick={onZoomIn}>
          +
        </button>
      </div>
      <div className="flex items-center border-l border-white/20 pl-2">
        <button
          type="button"
          className="rounded bg-red-600 px-2 py-0.5 text-sm text-white hover:bg-red-500"
          onClick={onClearCanvas}
        >
          Clear
        </button>
      </div>
    </nav>
  );
}
