type Props = {
  status: string;
};

export default function Status({ status }: Props) {
  let color: string;

  switch (status) {
    case "connected":
      color = "green";
      break;
    case "error":
      color = "red";
      break;
    case "warning":
      color = "yellow";
      break;
    default:
      color = "transparent";
  }

  return (
    <span
      style={{
        width: "0.5rem",
        height: "0.5rem",
        borderRadius: "50%",
        backgroundColor: color,
        border: "1px solid #55555555",
        display: "inline-block",
      }}
    />
  );
}
