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

export const certificates: Certificate[] = [
  { id: "38a2329c-da02-4592-bb1c-f65ce1daf5a1", name: "Begüm Bakan", date: "2026-03-15" },
  { id: "10242047-4b7d-48e7-9b41-243b60d7b909", name: "Bilge Akar", date: "2026-03-15" },
  { id: "df8bdfa0-1047-485d-ae2b-c63eae71ff3e", name: "Ozan Bolulu", date: "2026-03-15" },
  { id: "568a42ec-3c73-404b-8532-3bf216d1fa74", name: "Hüseyin Eren Özgün", date: "2026-03-15" },
];
