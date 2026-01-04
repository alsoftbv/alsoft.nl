import { useState, useMemo, useEffect } from "react";
import { ASCII_START, ASCII_END } from "@components/sfont/Config";
import { parseHexToGlyphs } from "@components/sfont/Utils";
import type { GlyphMap } from "@components/sfont/Types";
import Card from "@components/ui/Card";
import MultiStateButton from "@components/ui/MultiStateButton";

interface CodePreviewProps {
  width: number;
  height: number;
  fontName: string;
  glyphData: GlyphMap;
  onGlyphDataChange: (data: GlyphMap) => void;
  onConfigChange: (config: { width: number; height: number }) => void;
  onReset: () => void;
}

export default function CodePreview({
  width,
  height,
  fontName,
  glyphData,
  onGlyphDataChange,
  onConfigChange,
  onReset,
}: CodePreviewProps) {
  const safeFontName =
    fontName.replace(/[^a-zA-Z0-9_]/g, "") || `Font${width}x${height}`;

  const [copied, setCopied] = useState(false);
  const [localCode, setLocalCode] = useState("");

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

  const fullSource = useMemo(() => {
    let output = `#include "fonts.h"\n\n`;
    output += `const uint8_t ${safeFontName}_Table[] = {\n`;
    for (let i = ASCII_START; i <= ASCII_END; i++) {
      output += generateHexForChar(glyphData[i], i) + "\n\n";
    }
    output += `};\n\nsFONT ${safeFontName} = {\n  ${safeFontName}_Table,\n  ${width}, /* Width */\n  ${height} /* Height */\n};`;
    return output;
  }, [width, height, safeFontName, glyphData]);

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
    <Card
      className="code-preview"
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        display: "flex",
        justifyContent: "center",
        padding: "1rem",
        gap: "1rem",
      }}
    >
      <div
        className="preview-toolbar"
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "space-between",
        }}
      >
        <MultiStateButton
          idleText="Sync from Code"
          confirmText="Really Sync?"
          doneText="Synced!"
          onAction={handleImport}
        />
        <MultiStateButton
          idleText="Copy to Clipboard"
          doneText="Copied!"
          onAction={handleCopy}
        />
        <MultiStateButton
          idleText="Reset Font"
          confirmText="Really Reset?"
          doneText="Font Reset!"
          onAction={onReset}
        />
      </div>

      <textarea
        className="code-textarea"
        value={localCode}
        onChange={(e) => setLocalCode(e.target.value)}
        spellCheck={false}
      />
    </Card>
  );
}
