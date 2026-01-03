import { ASCII_START, ASCII_END } from "@components/sfont/Config";
import type { GlyphMap } from "@components/sfont/Types";

export const parseRawTable = (
  hexArray: number[],
  width: number,
  height: number
): GlyphMap => {
  const bytesPerRow = Math.ceil(width / 8);
  const bytesPerChar = bytesPerRow * height;
  const newGlyphMap: GlyphMap = {};

  for (let i = ASCII_START; i <= ASCII_END; i++) {
    const charIdx = i - ASCII_START;
    const startByte = charIdx * bytesPerChar;
    const charPixels = new Array(width * height).fill(false);

    for (let y = 0; y < height; y++) {
      for (let b = 0; b < bytesPerRow; b++) {
        const byte = hexArray[startByte + y * bytesPerRow + b];
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < width) {
            if ((byte & (1 << (7 - bit))) !== 0) {
              charPixels[y * width + x] = true;
            }
          }
        }
      }
    }
    newGlyphMap[i] = charPixels;
  }
  return newGlyphMap;
};

export const parseHexToGlyphs = (text: string) => {
  let detectedWidth = 0;
  let detectedHeight = 0;

  // 1. STRATEGY A: The sFONT Struct (The most reliable)
  // We look for the pattern: sFONT ... { ... TableName, Width, Height ... }
  // This version ignores newlines (\n) and tabs
  const sFontMatch = text.match(
    /sFONT[\s\S]*?\{[\s\S]*?,[\s\S]*?(\d+)[\s\S]*?,[\s\S]*?(\d+)/
  );

  if (sFontMatch) {
    detectedWidth = parseInt(sFontMatch[1], 10);
    detectedHeight = parseInt(sFontMatch[2], 10);
  }
  // 2. STRATEGY B: The comment headers (backup)
  else {
    const widthComment = text.match(/(\d+)\s+pixels wide/i);
    const heightComment =
      text.match(/Height\s*\*?\/\s*(\d+)/i) ||
      text.match(/(\d+)\s*\/\*\s*Height/i);

    if (widthComment) detectedWidth = parseInt(widthComment[1], 10);
    if (heightComment) detectedHeight = parseInt(heightComment[1], 10);
  }

  if (!detectedWidth || !detectedHeight) {
    return { data: null, width: 0, height: 0 };
  }

  // 3. HEX EXTRACTION
  const hexMatch = text.match(/0[xX][0-9A-Fa-f]{1,2}/g);
  if (!hexMatch)
    return { data: null, width: detectedWidth, height: detectedHeight };

  const bytes = hexMatch.map((h) => parseInt(h, 16));
  const bytesPerRow = Math.ceil(detectedWidth / 8);
  const bytesPerChar = bytesPerRow * detectedHeight;

  const newGlyphMap: GlyphMap = {};

  for (let i = ASCII_START; i <= ASCII_END; i++) {
    const charIdx = i - ASCII_START;
    const startByte = charIdx * bytesPerChar;

    if (startByte + bytesPerChar > bytes.length) break;

    const charPixels = new Array(detectedWidth * detectedHeight).fill(false);
    for (let y = 0; y < detectedHeight; y++) {
      for (let b = 0; b < bytesPerRow; b++) {
        const byte = bytes[startByte + y * bytesPerRow + b];
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < detectedWidth && byte & (1 << (7 - bit))) {
            charPixels[y * detectedWidth + x] = true;
          }
        }
      }
    }
    newGlyphMap[i] = charPixels;
  }

  return { data: newGlyphMap, width: detectedWidth, height: detectedHeight };
};
