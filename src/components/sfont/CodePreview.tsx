import { useState, useMemo, useEffect } from "react";
import { ASCII_START, ASCII_END } from "@components/sfont/Config";
import { parseHexToGlyphs } from "@components/sfont/Utils";
import type { GlyphMap } from "@components/sfont/Types";

interface CodePreviewProps {
  width: number;
  height: number;
  fontName: string;
  glyphData: GlyphMap;
  onGlyphDataChange: (data: GlyphMap) => void;
  onConfigChange: (config: { width: number; height: number }) => void;
}

export default function CodePreview({
  width,
  height,
  fontName,
  glyphData,
  onGlyphDataChange,
  onConfigChange,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [localCode, setLocalCode] = useState("");

  const safeFontName =
    fontName.replace(/[^a-zA-Z0-9_]/g, "") || `Font${width}x${height}`;

  // Helper moved inside or imported to keep it fresh with current width/height
  const generateHexForChar = (
    pixels: boolean[] | undefined,
    charCode: number
  ) => {
    const currentPixels = pixels || new Array(width * height).fill(false);
    const bytesPerRow = Math.ceil(width / 8);
    const lines: string[] = [];

    lines.push(
      `  // @${charCode} '${String.fromCharCode(charCode)}' (${width} pixels wide)`
    );

    for (let y = 0; y < height; y++) {
      let rowHex: string[] = [];
      let visualComment = "";

      for (let x = 0; x < width; x++) {
        visualComment += currentPixels[y * width + x] ? "#" : " ";
      }

      for (let b = 0; b < bytesPerRow; b++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < width && currentPixels[y * width + x]) {
            byte |= 1 << (7 - bit);
          }
        }
        rowHex.push(`0x${byte.toString(16).toUpperCase().padStart(2, "0")}`);
      }
      lines.push(`  ${rowHex.join(", ")}, // ${visualComment}`);
    }
    return lines.join("\n");
  };

  // Memoize the code generation to prevent lag when typing
  const fullSource = useMemo(() => {
    let output = `#include "fonts.h"\n\n`;
    output += `const uint8_t ${safeFontName}_Table[] = {\n`;
    for (let i = ASCII_START; i <= ASCII_END; i++) {
      output += generateHexForChar(glyphData[i], i) + "\n\n";
    }
    output += `};\n\nsFONT ${safeFontName} = {\n  ${safeFontName}_Table,\n  ${width}, /* Width */\n  ${height} /* Height */\n};`;
    return output;
  }, [width, height, safeFontName, glyphData]);

  // Sync local text state when the source changes from the grid
  useEffect(() => {
    setLocalCode(fullSource);
  }, [fullSource]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const {
      data,
      width: dWidth,
      height: dHeight,
    } = parseHexToGlyphs(localCode);

    if (data) {
      onConfigChange({ width: dWidth, height: dHeight });
      onGlyphDataChange(data);
    } else {
      alert("Dimensions could not be detected");
    }
  };

  return (
    <div className="code-preview">
      <div
        className="preview-toolbar"
        style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
      >
        <button onClick={handleImport} className="import-btn">
          Sync from Code
        </button>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? "✓ Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <textarea
        className="code-textarea"
        value={localCode}
        onChange={(e) => setLocalCode(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
