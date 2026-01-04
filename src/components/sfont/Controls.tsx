import { type ChangeEvent } from "react";
import { ASCII_START, ASCII_END } from "@components/sfont/Config";
import type { ControlConfig, ConfigKey } from "@components/sfont/Types";
import Card from "@components/ui/Card";

interface ControlsProps {
  config: ControlConfig;
  charCode: number;
  onConfigChange: (key: ConfigKey, value: string | number) => void;
  onCharChange: (code: number) => void;
  onClear: () => void;
}

export default function Controls({
  config,
  charCode,
  onConfigChange,
  onCharChange,
  onClear,
}: ControlsProps) {
  const asciiOptions = Array.from(
    { length: ASCII_END - ASCII_START + 1 },
    (_, i) => i + ASCII_START
  );

  const handleIntChange = (
    key: ConfigKey,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseInt(e.target.value, 10);
    onConfigChange(key, isNaN(val) ? 1 : val);
  };

  return (
    <Card className="controls-container">
      <div className="control-row">
        <div className="control-group" style={{ flexGrow: 1 }}>
          <label>Font Name (C Struct)</label>
          <input
            type="text"
            value={config.fontName}
            onChange={(e) => onConfigChange("fontName", e.target.value)}
          />
        </div>
        <div className="control-group">
          <label>Width</label>
          <input
            type="number"
            value={config.width}
            onChange={(e) => handleIntChange("width", e)}
            min={1}
            max={64}
            style={{ width: "60px" }}
          />
        </div>
        <div className="control-group">
          <label>Height</label>
          <input
            type="number"
            value={config.height}
            onChange={(e) => handleIntChange("height", e)}
            min={1}
            max={64}
            style={{ width: "60px" }}
          />
        </div>
      </div>

      <div className="control-row" style={{ alignItems: "flex-end" }}>
        <div className="control-group" style={{ flexGrow: 1 }}>
          <label>Select ASCII Character</label>
          <select
            value={charCode}
            onChange={(e) => onCharChange(parseInt(e.target.value, 10))}
            style={{ width: "100%" }}
          >
            {asciiOptions.map((code) => (
              <option key={code} value={code}>
                @{code} - {String.fromCharCode(code)}
              </option>
            ))}
          </select>
        </div>

        <button onClick={onClear} className="clear-btn">
          Clear Grid
        </button>
      </div>
    </Card>
  );
}
