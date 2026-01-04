import { useState, useEffect, type CSSProperties } from "react";

interface MultiStateButtonProps {
  idleText: string;
  confirmText?: string;
  doneText: string;
  onAction: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function MultiStateButton({
  idleText,
  confirmText,
  doneText,
  onAction,
  className,
  style,
}: MultiStateButtonProps) {
  const [status, setStatus] = useState<"idle" | "confirm" | "done">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleClick = () => {
    if (status === "idle") {
      if (!confirmText) {
        setStatus("done");
      } else {
        setStatus("confirm");
      }
    } else if (status === "confirm") {
      onAction();
      setStatus("done");
    }
  };

  return (
    <button onClick={handleClick} className={className} style={style}>
      {status === "idle" && idleText}
      {status === "confirm" && confirmText}
      {status === "done" && doneText}
    </button>
  );
}
