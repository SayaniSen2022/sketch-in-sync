import { useState, useRef, useEffect } from "react";
import type { Tool } from "@/canvas/editor/Tool";
import CanvasEngine from "../canvas/CanvasEngine";
import Toolbar from "./Toolbar";
import StyleSidebar from "./StyleSidebar";
import EditorState from "@/canvas/editor/EditorState";
import { DEFAULT_CANVAS_BACKGROUND } from "@/canvas/stylePresets";

const Canvas = () => {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [, forceUpdate] = useState(0);
  //reference to the real DOM element. When React mounts the component, internally it creates the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [tool, setTool] = useState<Tool>("rectangle");

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editor?.textEditing) return;

    requestAnimationFrame(() => {
      const textarea = textInputRef.current;

      if (!textarea) return;

      textarea.focus();
      const caretIndex = Math.min(editor.textCaretIndex, textarea.value.length);
      textarea.setSelectionRange(caretIndex, caretIndex);
    });
  }, [editor?.textEditing, editor?.textX, editor?.textY, editor?.textCaretIndex]);

  // Grow the textarea to fit its content; the DOM renders the draft while editing.
  useEffect(() => {
    const textarea = textInputRef.current;

    if (!editor?.textEditing || !textarea) return;

    textarea.style.width = "4px";
    textarea.style.height = `${editor.textFontSize}px`;
    textarea.style.width = `${textarea.scrollWidth + 4}px`;
    textarea.style.height = `${textarea.scrollHeight + 4}px`;
  }, [editor?.textEditing, editor?.textValue, editor?.textFontSize, editor?.textFontFamily]);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    editor?.updateTextValue(e.target.value);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      editor?.finishTextEditing();
      return;
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      engineRef.current?.finishTextEditing();
    }
  };

  const engine = engineRef.current;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: editor?.canvasBackgroundColor ?? DEFAULT_CANVAS_BACKGROUND }}
    >
      <Toolbar
        currentTool={tool}
        onToolChange={handleToolChange}
        onClearCanvas={() => engine?.clearCanvas()}
      />
      <StyleSidebar
        editor={editor}
        onStrokeColorChange={(color) => engine?.setStrokeColor(color)}
        onStrokeWidthChange={(width) => engine?.setStrokeWidth(width)}
        onTextFontSizeChange={(size) => engine?.setTextFontSize(size)}
        onTextFontFamilyChange={(fontFamily) => engine?.setTextFontFamily(fontFamily)}
        onBackgroundColorChange={(color) => engine?.setCanvasBackgroundColor(color)}
      />

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

      {editor?.textEditing && (
        <textarea
          ref={textInputRef}
          value={editor.textValue}
          onChange={handleTextChange}
          onKeyDown={handleTextKeyDown}
          onBlur={() => engineRef.current?.finishTextEditing()}
          style={{
            position: "fixed",
            left: editor.textX,
            top: editor.textY,
            padding: 0,
            margin: 0,
            border: "none",
            outline: "none",
            resize: "none",
            overflow: "hidden",
            whiteSpace: "pre",
            background: "transparent",
            color: "#fff",
            caretColor: "#fff",
            fontSize: editor.textFontSize,
            fontFamily: editor.textFontFamily,
            lineHeight: `${editor.textFontSize}px`,
            zIndex: 9999,
          }}
          name="text-val"
        />
      )}
    </div>
  );
};

export default Canvas;
