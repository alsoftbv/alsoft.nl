import { useRef, useEffect, useState } from "react";
import type { GlyphMap } from "@components/sfont/Types";
import Card from "@components/ui/Card";

interface CanvasGridProps {
  width: number;
  height: number;
  selectedChar: number;
  glyphData: GlyphMap;
  onGlyphUpdate: (char: number, pixels: boolean[]) => void;
}

export default function CanvasGrid({
  width,
  height,
  selectedChar,
  glyphData,
  onGlyphUpdate,
}: CanvasGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<boolean>(true);
  const [pixelSize, setPixelSize] = useState(30);

  const MAX_PIXEL_SIZE = 20;
  const MIN_PIXEL_SIZE = 5;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const padding = 40;
      const availableWidth = containerRef.current.offsetWidth - padding;
      const availableHeight = window.innerHeight * 0.4;

      const sizeToFitWidth = Math.floor(availableWidth / width);
      const sizeToFitHeight = Math.floor(availableHeight / height);

      let optimalSize = Math.min(sizeToFitWidth, sizeToFitHeight);

      if (optimalSize > MAX_PIXEL_SIZE) optimalSize = MAX_PIXEL_SIZE;
      if (optimalSize < MIN_PIXEL_SIZE) optimalSize = MIN_PIXEL_SIZE;

      setPixelSize(optimalSize);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventDefault = (e: Event) => e.preventDefault();
    canvas.addEventListener("touchstart", preventDefault, { passive: false });
    canvas.addEventListener("touchmove", preventDefault, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", preventDefault);
      canvas.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#3f3f3f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pixels =
      glyphData[selectedChar] || new Array(width * height).fill(false);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pxX = x * pixelSize;
        const pxY = y * pixelSize;
        ctx.fillStyle = pixels[y * width + x] ? "#000000" : "#ffffff";
        ctx.fillRect(pxX + 1, pxY + 1, pixelSize - 2, pixelSize - 2);
      }
    }
  }, [width, height, selectedChar, glyphData, pixelSize]);

  const getCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((clientX - rect.left) * scaleX) / pixelSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / pixelSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y, index: y * width + x };
    }
    return null;
  };

  const startDrawing = (clientX: number, clientY: number) => {
    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;

    const currentPixels =
      glyphData[selectedChar] || new Array(width * height).fill(false);
    const newMode = !currentPixels[coords.index];

    setDrawMode(newMode);
    setIsDrawing(true);

    const updatedPixels = [...currentPixels];
    updatedPixels[coords.index] = newMode;
    onGlyphUpdate(selectedChar, updatedPixels);
  };

  const paintAtPosition = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;

    const currentPixels = [
      ...(glyphData[selectedChar] || new Array(width * height).fill(false)),
    ];
    if (currentPixels[coords.index] !== drawMode) {
      currentPixels[coords.index] = drawMode;
      onGlyphUpdate(selectedChar, currentPixels);
    }
  };

  return (
    <Card
      ref={containerRef}
      className="canvas-container"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        style={{
          cursor: "crosshair",
          touchAction: "none",
          backgroundColor: "#ffffff",
        }}
        onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
        onMouseMove={(e) => paintAtPosition(e.clientX, e.clientY)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onTouchStart={(e) =>
          startDrawing(e.touches[0].clientX, e.touches[0].clientY)
        }
        onTouchMove={(e) =>
          paintAtPosition(e.touches[0].clientX, e.touches[0].clientY)
        }
        onTouchEnd={() => setIsDrawing(false)}
      />
    </Card>
  );
}
