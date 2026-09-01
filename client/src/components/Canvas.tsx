import { useState } from "react";
import type { Tool } from "@/canvas/editor/Tool";
import { useRef, useEffect } from "react";
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

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;
    engine.init();

    const editorState = engine.getEditor();

    editorState.setOnChange(() => {
      forceUpdate((value) => value + 1);
    });

    setEditor(editorState);

    engine.setTool(tool);

    return () => engine.destroy();
  }, []);

  const handleToolChange = (tool: Tool) => {
    setTool(tool);
    engineRef.current?.setTool(tool);
  };

  return (
    <div>
      <Toolbar currentTool={tool} onToolChange={handleToolChange} />

      <canvas
        className={`w-full h-full ${
          tool === "select"
            ? "cursor-default"
            : tool === "text"
              ? "cursor-text"
              : "cursor-crosshair"
        }`}
        ref={canvasRef}
      />
      {editor?.textEditing && (
        <textarea
          autoFocus
          value={editor.textValue}
          onChange={(e) => editor.updateTextValue(e.target.value)}

          style={{
            position: "absolute",
            left: editor.textX,
            top: editor.textY,

            // Important for making it look like text is being
            // typed directly on the canvas
            fontSize: "20px",
            fontFamily: "Arial",
            lineHeight: "1.2",

            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",

            padding: 0,
            margin: 0,
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
