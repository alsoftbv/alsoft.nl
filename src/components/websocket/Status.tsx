type Props = {
  status: string;
};

export default function WSStatus({ status }: Props) {
  return <p>Status: {status}</p>;
}
