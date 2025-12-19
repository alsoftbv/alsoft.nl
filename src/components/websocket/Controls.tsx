import { useState } from "react";
import type { BinaryFormat } from "@components/websocket/Client";
import Status from "@components/websocket/Status";
import MessageInput from "@components/websocket/MessageInput";
import type { MessageType } from "@components/websocket/Message";
import en from "@locales/en.json";
import nl from "@locales/nl.json";

type Props = {
  status: string;
  lang: "en" | "nl";
  connect: (url: string) => void;
  disconnect: () => void;
  clear: () => void;
  sendMessage: (
    msg: string,
    type: MessageType,
    binaryFormat: BinaryFormat
  ) => void;
};

export default function Controls({
  status,
  lang,
  connect,
  disconnect,
  clear,
  sendMessage,
}: Props) {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [type, setType] = useState<MessageType>("text");
  const [binaryFormat, setBinaryFormat] = useState<BinaryFormat>("hex");
  const [isValid, setIsValid] = useState(true);
  const t = lang === "en" ? en : nl;

  const toggleConnection = () => {
    if (status === "connected") {
      disconnect();
    } else {
      connect(url);
    }
  };

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        sendMessage(input, type, binaryFormat);
        break;
    }
  };

  return (
    <>
      <section
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://example.com"
          style={{
            flex: 1,
            minWidth: 0,
          }}
        />

        <button
          onClick={toggleConnection}
          style={{
            display: "flex",
            alignItems: "start",
            gap: "0.5rem",
            paddingLeft: "0.8rem",
          }}
        >
          <Status status={status} />
          {status === "connected"
            ? t.websocket.disconnect
            : t.websocket.connect}
        </button>

        <button onClick={clear}>{t.websocket.clear}</button>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.5rem",
          margin: "1rem 0",
        }}
      >
        <MessageInput
          value={input}
          lang={lang}
          onValueChange={setInput}
          type={type}
          binaryFormat={binaryFormat}
          onValidityChange={setIsValid}
          onKey={onKeyPress}
          style={{
            flex: 1,
            minWidth: 0,
          }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MessageType)}
        >
          <option value="text">Text</option>
          <option value="binary">Binary</option>
        </select>
        {type === "binary" && (
          <select
            value={binaryFormat}
            onChange={(e) => {
              setBinaryFormat(e.target.value as BinaryFormat);
              setInput("");
            }}
          >
            <option value="hex">Hex</option>
            <option value="utf8">UTF-8</option>
            <option value="base64">Base64</option>
          </select>
        )}
        <button
          onClick={() => {
            sendMessage(input, type, binaryFormat);
          }}
          disabled={status !== "connected" || !isValid}
        >
          {t.websocket.send}
        </button>
      </section>
    </>
  );
}
