import { useRef, useEffect } from "react";
import CanvasEngine from "./CanvasEngine";

const Canvas = () => {
  //reference to the real DOM element. When React mounts the component, internally it creates the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // console.log(canvasRef.current); HTMLCanvasElement is logged

    // what id ref is still null? we know useEffect runs after mount, TypeScript doesn't know that.
    // Therefore, use guard clause
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engine.init();

    return () => engine.destroy();
  }, []);

  return (
    <>
      <canvas className="border border-red-500 w-screen h-screen" ref={canvasRef} />
    </>
  );
};

export default Canvas;
