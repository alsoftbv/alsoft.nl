import { readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";

const [name, date] = process.argv.slice(2);

if (!name || !date) {
  console.error('Usage: npm run add-cert -- "Name" "YYYY-MM-DD"');
  process.exit(1);
}

const filePath = new URL("../src/data/certificates.ts", import.meta.url);
const content = readFileSync(filePath, "utf-8");

const id = randomUUID();
const entry = `  { id: "${id}", name: "${name}", date: "${date}" },`;

const updated = content.replace(
  /export const certificates: Certificate\[] = \[([^\]]*)\];/,
  (_, inner) => {
    const trimmed = inner.trimEnd();
    const entries = trimmed ? `${trimmed}\n${entry}\n` : `\n${entry}\n`;
    return `export const certificates: Certificate[] = [${entries}];`;
  },
);

writeFileSync(filePath, updated);
console.log(`Added certificate for ${name}`);
console.log(`URL: https://alsoft.nl/certificate/${id}`);
