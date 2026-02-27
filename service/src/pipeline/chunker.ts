import { hashContent } from "./estimator.js";

export interface TextChunk {
  chunkId: string;
  text: string;
  hash: string;
  order: number;
}

const MAX_CHARS = 800;
const MIN_CHARS = 20;

export function chunkText(notePath: string, text: string): TextChunk[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CHARS);

  const chunks: TextChunk[] = [];
  let buf = "";
  let order = 0;

  for (const para of paragraphs) {
    if (buf.length > 0 && buf.length + para.length + 2 > MAX_CHARS) {
      chunks.push(makeChunk(notePath, order++, buf));
      buf = para;
    } else {
      buf = buf.length > 0 ? `${buf}\n\n${para}` : para;
    }
  }

  if (buf.length >= MIN_CHARS) {
    chunks.push(makeChunk(notePath, order, buf));
  }

  return chunks;
}

function makeChunk(notePath: string, order: number, text: string): TextChunk {
  const hash = hashContent(text).slice(0, 16);
  const safeKey = notePath.replace(/[^a-z0-9]/gi, "_");
  return { chunkId: `${safeKey}_${order}`, text, hash, order };
}
