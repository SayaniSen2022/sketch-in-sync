import type { Tool } from "@/canvas/editor/Tool";
import "../index.css";

type ToolbarProps = {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
};

const TOOLS: { tool: Tool; label: string }[] = [
  { tool: "select", label: "Select" },
  { tool: "rectangle", label: "Rectangle" },
  { tool: "ellipse", label: "Ellipse" },
  { tool: "line", label: "Line" },
  { tool: "arrow", label: "Arrow" },
];

export default function Toolbar({ currentTool, onToolChange }: ToolbarProps) {
  return (
    <nav className=" absolute top-2 left-1/2 -translate-x-1/2 flex justify-center gap-2 w-1/4 p-2 border border-white/10 rounded rounded-lg shadow-xl text-white bg-gray-700">
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
    </nav>
  );
}
