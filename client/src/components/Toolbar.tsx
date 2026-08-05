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
    <nav className="flex gap-2 align-items-center p-4 border border-white/10 rounded rounded-3xl shadow-xl mb-4 w-1/2 mx-auto text-white justify-center bg-gray-700">
      {TOOLS.map(({ tool, label }) => (
        <button
          key={tool}
          onClick={() => onToolChange(tool)}
          className={currentTool === tool ? "active" : ""}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
