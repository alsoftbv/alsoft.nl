import { forwardRef } from "react";
import type { ChatMessage } from "@components/websocket/Message";

type Props = {
  messages: ChatMessage[];
};

const MessageList = forwardRef<HTMLUListElement, Props>(({ messages }, ref) => (
  <ul
    ref={ref}
    style={{
      height: "400px",
      overflowY: "auto",
      border: "1px solid #3f3f3f",
      borderRadius: "8px",
      padding: "1rem",
      listStyle: "none",
      marginTop: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    }}
  >
    {messages.map((msg, i) => {
      const time = msg.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (msg.type === "status") {
        return (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0.5rem 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "#3f3f3f",
                margin: "0 1rem",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "#999",
                whiteSpace: "nowrap",
              }}
            >
              {msg.text}
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "#3f3f3f",
                margin: "0 1rem",
              }}
            />
          </li>
        );
      }

      return (
        <li
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.type === "sent" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              backgroundColor: msg.type === "sent" ? "#ff9100" : "#3f3f3f",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: "16px",
              maxWidth: "70%",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                opacity: 0.7,
                marginBottom: "0.25rem",
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <span>{time}</span>
              <span>{msg.messageType}</span>
            </div>
            <div>{msg.text}</div>
          </div>
        </li>
      );
    })}
  </ul>
));

export default MessageList;
