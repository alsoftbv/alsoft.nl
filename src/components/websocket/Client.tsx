import { useState, useRef, type HTMLAttributes, useEffect } from "react";
import Controls from "@components/websocket/Controls";
import MessageList from "@components/websocket/MessageList";
import {
  createMessage,
  formatMessage,
  type ChatMessage,
  type Message,
  type MessageType,
} from "@components/websocket/Message";

export type BinaryFormat = "hex" | "utf8" | "base64";

type Props = {
  lang: "en" | "nl";
} & HTMLAttributes<HTMLDivElement>;

export default function WebSocketClient({ lang, ...props }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef<HTMLUListElement>(null);

  const connect = (url: string) => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => setStatus("connected");

    socketRef.current.onclose = () => {
      setStatus("disconnected");
    };

    socketRef.current.onerror = () => {
      setStatus("error");
    };

    socketRef.current.onmessage = async (e) => {
      const msg: Message = await createMessage(e);
      setMessages((prev) => [
        ...prev,
        {
          text: msg.content,
          type: "received",
          messageType: msg.type,
          timestamp: new Date(),
        },
      ]);
    };
  };

  const disconnect = () => socketRef.current?.close();

  const clear = () => setMessages([]);

  const sendMessage = (
    msg: string,
    type: MessageType,
    binaryFormat: BinaryFormat
  ) => {
    const cleaned = normalize(msg, type, binaryFormat);

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
      return;

    let message: string;
    if (type === "text") {
      socketRef.current.send(cleaned);
      message = cleaned;
    } else {
      const data = encodeBinary(cleaned, binaryFormat);
      socketRef.current.send(data);
      message = formatMessage(data);
    }

    setMessages((prev) => [
      ...prev,
      {
        text: message,
        type: "sent",
        messageType: type,
        timestamp: new Date(),
      },
    ]);
  };

  const normalize = (
    raw: string,
    type: MessageType,
    binaryFormat: BinaryFormat
  ): string => {
    if (type !== "binary") return raw;

    switch (binaryFormat) {
      case "hex":
        return raw
          .replace(/0x/gi, "")
          .replace(/[^0-9a-fA-F]/g, "")
          .toUpperCase();

      case "base64":
        return raw.replace(/[^A-Za-z0-9+/=]/g, "");

      case "utf8":
      default:
        return raw;
    }
  };

  const encodeBinary = (input: string, format: BinaryFormat): Uint8Array => {
    switch (format) {
      case "hex": {
        const cleaned = input.replace(/\s+/g, "");
        const bytes = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
        }
        return bytes;
      }

      case "base64": {
        const binaryString = atob(input);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      case "utf8":
      default:
        return new TextEncoder().encode(input);
    }
  };

  useEffect(() => {
    if (messagesRef.current) {
      if (
        messagesRef.current.scrollTop + messagesRef.current.clientHeight >
        messagesRef.current.scrollHeight - 100
      ) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div {...props}>
      <Controls
        status={status}
        lang={lang}
        connect={connect}
        disconnect={disconnect}
        clear={clear}
        sendMessage={sendMessage}
      />
      <MessageList messages={messages} ref={messagesRef} />
    </div>
  );
}
