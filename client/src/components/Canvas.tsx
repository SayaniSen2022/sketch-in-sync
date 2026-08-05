import { useState } from "react";
import type { Tool } from "@/canvas/editor/Tool";
import { useRef, useEffect } from "react";
import CanvasEngine from "../canvas/CanvasEngine";
import Toolbar from "./Toolbar";

const Canvas = () => {
  //reference to the real DOM element. When React mounts the component, internally it creates the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [tool, setTool] = useState<Tool>("rectangle");

  useEffect(() => {
    const canvas = canvasRef.current;
    // console.log(canvasRef.current); HTMLCanvasElement is logged

    // what id ref is still null? we know useEffect runs after mount, TypeScript doesn't know that.
    // Therefore, use guard clause
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = new CanvasEngine(canvas);
    engineRef.current.init();
    engineRef.current.setTool(tool);

    return () => engine.destroy();
  }, []);

  const handleToolChange = (tool: Tool) => {
    setTool(tool);
    engineRef.current?.setTool(tool);
  };

  return (
    <div className="bg-neutral-900">
      <Toolbar currentTool={tool} onToolChange={handleToolChange} />

      <canvas className="border border-red-500 w-full h-full" ref={canvasRef} />
    </div>
  );
};

export default Canvas;
