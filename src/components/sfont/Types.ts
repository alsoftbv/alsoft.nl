export type GlyphMap = Record<number, boolean[]>;

export interface ControlConfig {
  width: number;
  height: number;
  fontName: string;
}

export type ConfigKey = keyof ControlConfig;
