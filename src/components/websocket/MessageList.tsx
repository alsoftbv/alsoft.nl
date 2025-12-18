import { forwardRef } from "react";

type Props = {
  messages: string[];
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
    }}
  >
    {messages.map((msg, i) => (
      <li key={i} style={{ fontFamily: "monospace", padding: "2px 0" }}>
        {msg}
      </li>
    ))}
  </ul>
));

export default MessageList;
