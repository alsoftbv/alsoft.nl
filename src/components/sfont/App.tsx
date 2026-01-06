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
    return parseRawTable(FONT12_HEX, DEFAULT_WIDTH, DEFAULT_HEIGHT);
  });

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      localStorage.setItem("sfont_config", JSON.stringify(config));
      localStorage.setItem("sfont_data", JSON.stringify(glyphData));
    }, 500);

    return () => clearTimeout(syncTimer);
  }, [glyphData, config]);

  const handleResetToDefault = () => {
    setConfig({
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      fontName: DEFAULT_FONT_NAME,
    });

    const defaultPixels = parseRawTable(
      FONT12_HEX,
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT
    );
    setGlyphData(defaultPixels);
    setCharCode(ASCII_A);
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
      const val = String(value);
      setConfig((prev) => ({ ...prev, fontName: val }));
    }
  };

  const handleGlyphDataChange = (newData: GlyphMap) => {
    setGlyphData(newData);
  };

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
            height={config.height}
            selectedChar={charCode}
            glyphData={glyphData}
            onGlyphUpdate={(char, newPixels) => {
              setGlyphData((prev) => ({
                ...prev,
                [char]: newPixels,
              }));
            }}
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
            onReset={handleResetToDefault}
          />
        </div>
      </main>
      <style>
        {`
        .app-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
        }

        .main-layout {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: stretch;
        }

        .editor-pane {
            flex: 1;
            min-width: 350px;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .preview-pane {
            flex: 1;
            min-width: 350px;
        }

        .controls-container {
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .control-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .preview-char {
            font-size: 2rem;
            font-weight: bold;
            border: 1px solid #ddd;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            margin-top: auto;
        }

        .code-preview {
            display: flex;
            flex-direction: column;
            height: 100%; 
        }

        .code-preview textarea {
            flex-grow: 1;
            font-family: monospace;
            padding: 15px;
            background: #3f3f3f;
            resize: none;
        }
        
        @media (max-width: 900px) {
            .main-layout {
                flex-direction: column;
            }

            .code-preview textarea {
                height: 400px;
            }
        }`}
      </style>
    </div>
  );
}
