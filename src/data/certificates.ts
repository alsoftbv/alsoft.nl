export interface Certificate {
  id: string;
  name: string;
  date: string;
}

export const trainingParts = [
  {
    title: "Foundations",
    topics: [
      "Reading engineering documentation",
      "Using software engineering tools (git, IDEs)",
      "Writing production code with good practices",
      "Working with WebSockets",
      "MVC architecture concepts",
    ],
  },
  {
    title: "Resilience",
    topics: [
      "Working with CRC checksums",
      "Writing defensive code",
      "Reverse-engineering systems",
      "Detecting prototype device issues",
      "Responding to architectural changes",
    ],
  },
  {
    title: "Production",
    topics: [
      "Writing algorithms for given problems",
      "Keeping device logs for data processing",
      "Identifying and solving bugs",
      "Getting software ready for production",
      "Principles of UI design",
    ],
  },
];

export const certificates: Certificate[] = [];
