export type MessageType = "text" | "binary";

export interface Message {
  type: MessageType;
  content: string;
  timestamp: Date;
}

export async function createMessage(event: MessageEvent): Promise<Message> {
  let content: string;
  const type: MessageType = typeof event.data === "string" ? "text" : "binary";

  if (type === "text") {
    content = event.data.toString();
  } else {
    let buffer: ArrayBuffer;
    if (event.data instanceof Blob) {
      buffer = await event.data.arrayBuffer();
    } else {
      buffer = event.data;
    }
    const bytes = new Uint8Array(buffer);
    content = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
  }

  return {
    type,
    content,
    timestamp: new Date(),
  };
}

export function formatMessage(message: Message): string {
  const time = message.timestamp.toLocaleTimeString();
  return `[${time}] [${message.type}] ${message.content}`;
}
