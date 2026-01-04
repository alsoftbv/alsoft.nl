import { useEffect, useState } from "react";
import Controls from "./Controls";
import CanvasGrid from "./CanvasGrid";
import CodePreview from "./CodePreview";
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_FONT_NAME,
  FONT12_HEX,
  ASCII_A,
} from "@components/sfont/Config";
import type {
  GlyphMap,
  ControlConfig,
  ConfigKey,
} from "@components/sfont/Types";
import { parseRawTable } from "@components/sfont/Utils";

export default function App() {
  const [config, setConfig] = useState<ControlConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sfont_config");
      if (saved) return JSON.parse(saved);
    }
    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      fontName: DEFAULT_FONT_NAME,
    };
  });
  const [charCode, setCharCode] = useState<number>(ASCII_A);
  const [glyphData, setGlyphData] = useState<GlyphMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sfont_data");
      if (saved) return JSON.parse(saved);
    }
    return parseRawTable(FONT12_HEX, 7, 12);
  });
  const [drawMode, setDrawMode] = useState<"paint" | "erase" | null>(null);

  useEffect(() => {
    localStorage.setItem("sfont_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("sfont_data", JSON.stringify(glyphData));
  }, [glyphData]);

  const setPixel = (index: number, mode: "paint" | "erase") => {
    const current =
      glyphData[charCode] ||
      new Array(config.width * config.height).fill(false);

    // Only update if the pixel actually needs to change
    const newValue = mode === "paint";
    if (current[index] === newValue) return;

    const next = [...current];
    next[index] = newValue;

    setGlyphData((prev) => ({
      ...prev,
      [charCode]: next,
    }));
  };

  const clearCurrentGlyph = () => {
    setGlyphData((prev) => ({
      ...prev,
      [charCode]: new Array(config.width * config.height).fill(false),
    }));
  };

  const handleImportConfig = (newSize: { width: number; height: number }) => {
    setConfig((prev) => ({ ...prev, ...newSize }));
  };

  const handleConfigChange = (key: ConfigKey, value: string | number) => {
    if (key === "width" || key === "height") {
      const val = typeof value === "number" ? value : parseInt(value, 10) || 1;
      const newWidth = key === "width" ? val : config.width;
      const newHeight = key === "height" ? val : config.height;

      const newGlyphData: GlyphMap = {};

      Object.keys(glyphData).forEach((codeStr) => {
        const code = parseInt(codeStr);
        const oldPixels = glyphData[code];
        const newPixels = new Array(newWidth * newHeight).fill(false);

        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x < config.width; x++) {
            if (x < newWidth && y < newHeight) {
              const oldIdx = y * config.width + x;
              const newIdx = y * newWidth + x;
              if (oldPixels[oldIdx]) newPixels[newIdx] = true;
            }
          }
        }
        newGlyphData[code] = newPixels;
      });

      setGlyphData(newGlyphData);
      setConfig((prev) => ({ ...prev, [key]: val }));
    } else if (key === "fontName") {
      // Specifically handle string for fontName to satisfy TS
      const val = String(value);
      setConfig((prev) => ({ ...prev, fontName: val }));
    }
  };

  const handleGlyphDataChange = (newData: GlyphMap) => {
    setGlyphData(newData);
  };

  const currentPixels =
    glyphData[charCode] || new Array(config.width * config.height).fill(false);

  return (
    <div className="app-container">
      <main className="main-layout">
        <div className="editor-pane">
          <Controls
            config={config}
            charCode={charCode}
            onConfigChange={handleConfigChange}
            onCharChange={setCharCode}
            onClear={clearCurrentGlyph}
          />
          <CanvasGrid
            width={config.width}
            pixels={currentPixels}
            drawMode={drawMode}
            onDrawStart={(index) => {
              const mode = currentPixels[index] ? "erase" : "paint";
              setDrawMode(mode);
              setPixel(index, mode);
            }}
            onDrawMove={(index) => {
              if (drawMode) setPixel(index, drawMode);
            }}
            onDrawEnd={() => setDrawMode(null)}
          />
        </div>
        <div className="preview-pane">
          <CodePreview
            width={config.width}
            height={config.height}
            fontName={config.fontName}
            glyphData={glyphData}
            onGlyphDataChange={handleGlyphDataChange}
            onConfigChange={handleImportConfig}
          />
        </div>
      </main>
    </div>
  );
}
