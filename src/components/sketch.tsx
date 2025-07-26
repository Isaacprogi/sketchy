import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Palette,
  Eraser,
  Download,
  Trash2,
  Undo,
  Redo,
  Minus,
  Plus,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

const SketchApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingPath[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[][]>([]);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
  ];

  const getPointFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
      if (path.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (path.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      ctx.stroke();
    },
    []
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach((path) => {
      drawPath(ctx, path);
    });

    // Draw current path being drawn
    if (currentPath.length > 1) {
      const currentDrawingPath: DrawingPath = {
        points: currentPath,
        color: currentTool === "eraser" ? "#000000" : currentColor,
        width: brushSize,
        tool: currentTool,
      };
      drawPath(ctx, currentDrawingPath);
    }
  }, [paths, currentPath, currentColor, brushSize, currentTool, drawPath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getPointFromEvent(e);
    setCurrentPath([point]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getPointFromEvent(e);
    setCurrentPath((prev) => [...prev, point]);
  };

  const stopDrawing = () => {
    if (!isDrawing || currentPath.length === 0) return;

    const newPath: DrawingPath = {
      points: [...currentPath],
      color: currentTool === "eraser" ? "#000000" : currentColor,
      width: brushSize,
      tool: currentTool,
    };

    // Save current state for undo
    setUndoStack((prev) => [...prev, paths]);
    setRedoStack([]); // Clear redo stack when new action is performed

    setPaths((prev) => [...prev, newPath]);
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setUndoStack((prev) => [...prev, paths]);
    setRedoStack([]);
    setPaths([]);
    setCurrentPath([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, paths]);
    setPaths(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, paths]);
    setPaths(nextState);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a temporary canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Fill white background
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw existing canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    // Download
    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const adjustBrushSize = (delta: number) => {
    setBrushSize((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white pt-2 pb-2 shadow-sm border-b ">
        {/* Toolbar */}
        <div className="flex bg-white flex-wrap items-center justify-center items-center gap-4">
          {/* Tool Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTool("pen")}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === "pen"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Palette size={20} />
            </button>
            <button
              onClick={() => setCurrentTool("eraser")}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === "eraser"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Eraser size={20} />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor === color ? "border-gray-800" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
            />
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustBrushSize(-1)}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-medium w-8 text-center">
              {brushSize}
            </span>
            <button
              onClick={() => adjustBrushSize(1)}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo size={20} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Redo size={20} />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded-lg bg-red-200 hover:bg-red-300 text-red-700"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={downloadImage}
              className="p-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-700"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white p-4 shadow-sm border-b">
        <div className="flex flex-wrap justify-between items-center text-sm text-gray-700 gap-2">
          <span className="font-medium">
            Tool:{" "}
            <span className="text-gray-900">
              {currentTool === "pen" ? "Pen" : "Eraser"}
            </span>
          </span>
          <span className="font-medium">
            Brush Size: <span className="text-gray-900">{brushSize}px</span>
          </span>
          <span className="font-medium flex items-center gap-1">
            Color:{" "}
            <span
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: currentColor }}
            ></span>
            <span className="text-gray-900">{currentColor}</span>
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-2 w-[max-content] rounded-lg shadow-lg h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className={`border border-gray-300 rounded ${
              currentTool === "pen" ? "cursor-pencil" : "cursor-eraser"
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default SketchApp;
