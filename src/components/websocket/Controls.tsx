import { useState } from "react";
import type { MessageType } from "./Client";

type Props = {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (msg: string, type: MessageType) => void;
};

export default function WSControls({
  connect,
  disconnect,
  sendMessage,
}: Props) {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [type, setType] = useState<MessageType>("text");

  return (
    <div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="wss://example.com"
        style={{ width: "70%" }}
      />
      <button className="button-base" onClick={() => connect(url)}>
        Connect
      </button>
      <button className="button-base" onClick={disconnect}>
        Disconnect
      </button>

      <div style={{ marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message"
          style={{ width: "70%" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MessageType)}
        >
          <option value="text">Text</option>
          <option value="binary">Binary</option>
        </select>
        <button
          className="button-base"
          onClick={() => {
            sendMessage(input, type);
            setInput("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
