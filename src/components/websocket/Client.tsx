import { useState, useRef, type HTMLAttributes } from "react";
import WSControls from "./Controls";
import WSMessageList from "./MessageList";
import WSStatus from "./Status";
import { createMessage, formatMessage, type Message } from "./Message";

export type MessageType = "text" | "binary";

export default function WSClient(props: HTMLAttributes<HTMLDivElement>) {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef<HTMLUListElement>(null);

  const connect = (url: string) => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => setStatus("connected");
    socketRef.current.onclose = () => setStatus("disconnected");
    socketRef.current.onerror = () => setStatus("error");

    socketRef.current.onmessage = async (e) => {
      const msg: Message = await createMessage(e);
      setMessages((prev) => [...prev, formatMessage(msg)]);

      if (messagesRef.current) {
        const el = messagesRef.current;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
          el.scrollTop = el.scrollHeight;
        }
      }
    };
  };

  const disconnect = () => socketRef.current?.close();

  const sendMessage = (msg: string, type: MessageType) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
      return;
    if (type === "text") {
      socketRef.current.send(msg);
    } else {
      socketRef.current.send(new TextEncoder().encode(msg));
    }
    setMessages((prev) => [...prev, `[Sent ${type}] ${msg}`]);
  };

  return (
    <div {...props}>
      <WSControls
        connect={connect}
        disconnect={disconnect}
        sendMessage={sendMessage}
      />
      <WSStatus status={status} />
      <WSMessageList messages={messages} ref={messagesRef} />
    </div>
  );
}
