import { useState } from "react";
import type { MessageType } from "@components/websocket/Client";
import Status from "@components/websocket/Status";

type Props = {
  status: string;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (msg: string, type: MessageType) => void;
};

export default function Controls({
  status,
  connect,
  disconnect,
  sendMessage,
}: Props) {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [type, setType] = useState<MessageType>("text");

  const toggleConnection = () => {
    if (status === "connected") {
      disconnect();
    } else {
      connect(url);
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
          {status === "connected" ? "Disconnect" : "Connect"}
        </button>
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message"
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
        <button
          onClick={() => {
            sendMessage(input, type);
            setInput("");
          }}
          disabled={status !== "connected"}
        >
          Send
        </button>
      </section>
    </>
  );
}
