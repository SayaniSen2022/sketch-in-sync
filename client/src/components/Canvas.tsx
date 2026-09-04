import { useState, useRef, useEffect } from "react";
import type { Tool } from "@/canvas/editor/Tool";
import CanvasEngine from "../canvas/CanvasEngine";
import Toolbar from "./Toolbar";
import EditorState from "@/canvas/editor/EditorState";

const Canvas = () => {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [, forceUpdate] = useState(0);
  //reference to the real DOM element. When React mounts the component, internally it creates the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [tool, setTool] = useState<Tool>("rectangle");

  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editor?.textEditing) return;

    requestAnimationFrame(() => {
      textInputRef.current?.focus();
      console.log("FOCUSED:", document.activeElement === textInputRef.current);
    });
  }, [editor?.textEditing]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;
    engine.init();

    const editorState = engine.getEditor();

    editorState.setOnChange(() => {
      forceUpdate((value) => value + 1);
      engine.render();
    });

    setEditor(editorState);

    engine.setTool(tool);

    return () => engine.destroy();
  }, []);

  const handleToolChange = (tool: Tool) => {
    setTool(tool);
    engineRef.current?.setTool(tool);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor?.updateTextValue(e.target.value);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-900">
      <Toolbar currentTool={tool} onToolChange={handleToolChange} />

      <canvas
        className={`absolute inset-0w-full h-full ${
          tool === "select"
            ? "cursor-default"
            : tool === "text"
              ? "cursor-text"
              : "cursor-crosshair"
        }`}
        ref={canvasRef}
      />

      <input
        ref={textInputRef}
        value={editor?.textValue ?? ""}
        onChange={handleTextChange}
        style={{
          position: "fixed",
          left: editor?.textX ?? 0,
          top: editor?.textY ?? 0,
          width: 1,
          height: 1,
          opacity: 0,
          zIndex: 9999,
        }}
        name="text-val"
      />
    </div>
  );
};

export default Canvas;
