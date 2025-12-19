import { useEffect } from "react";
import type { BinaryFormat } from "@components/websocket/Client";
import type { MessageType } from "@components/websocket/Message";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  type: MessageType;
  binaryFormat: BinaryFormat;
  onValidityChange?: (valid: boolean) => void;
  onKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function MessageInput({
  value,
  onValueChange,
  type,
  binaryFormat,
  onValidityChange,
  onKey,
  style,
}: Props) {
  let placeholder = "Message";
  let valid = true;

  if (type === "binary") {
    switch (binaryFormat) {
      case "hex": {
        placeholder = "BA AB 00";
        const cleaned = value.replace(/\s+/g, "").replace(/^0x/gi, "");
        valid =
          cleaned.length === 0 ||
          (/^[\da-fA-F]+$/.test(cleaned) && cleaned.length % 2 === 0);
        break;
      }

      case "base64":
        placeholder = "uqvA";
        valid = value.length === 0 || /^[A-Za-z0-9+/=]+$/.test(value);
        break;

      case "utf8":
        placeholder = "Message";
        valid = true;
        break;
    }
  }

  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  return (
    <input
      value={value}
      onChange={(e) => {
        onValueChange(e.target.value);
      }}
      onKeyDown={(e) => {
        onKey(e);
      }}
      placeholder={placeholder}
      style={{
        ...style,
        boxShadow: valid ? "none" : "0 0 0 2px red",
      }}
    />
  );
}
