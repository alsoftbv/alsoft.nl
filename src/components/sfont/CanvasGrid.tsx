import { Card } from "@components/ui/Card";
import React, { useEffect } from "react";

interface CanvasGridProps {
  width: number;
  pixels: boolean[];
  drawMode: "paint" | "erase" | null;
  onDrawStart: (index: number) => void;
  onDrawMove: (index: number) => void;
  onDrawEnd: () => void;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  width,
  pixels,
  drawMode,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
}) => {
  useEffect(() => {
    const handleGlobalMouseUp = () => onDrawEnd();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [onDrawEnd]);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${width}, 20px)`,
    gap: "1px",
    backgroundColor: "#ccc",
    border: "1px solid #999",
    width: "fit-content",
    userSelect: "none",
  };

  return (
    <Card className="canvas-wrapper">
      <div style={gridStyle}>
        {pixels.map((isActive, index) => (
          <div
            key={index}
            onMouseDown={(e) => {
              if (e.button === 0) onDrawStart(index);
            }}
            onMouseEnter={() => {
              if (drawMode) onDrawMove(index);
            }}
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: isActive ? "#000" : "#fff",
              cursor: "crosshair",
            }}
          />
        ))}
      </div>
    </Card>
  );
};

export default CanvasGrid;
