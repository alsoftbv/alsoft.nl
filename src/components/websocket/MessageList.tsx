import React, { forwardRef } from "react";

type Props = {
  messages: string[];
};

const WSMessageList = forwardRef<HTMLUListElement, Props>(({ messages }, ref) => (
  <ul
    ref={ref}
    style={{
      height: 300,
      overflowY: "auto",
      border: "1px solid #ccc",
      padding: 8,
      listStyle: "none",
      marginTop: 8,
    }}
  >
    {messages.map((msg, i) => (
      <li key={i} style={{ fontFamily: "monospace", padding: "2px 0" }}>
        {msg}
      </li>
    ))}
  </ul>
));

export default WSMessageList;
