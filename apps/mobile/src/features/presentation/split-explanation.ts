const TARGET_CHUNK_LENGTH = 600;
const MAX_CHUNK_LENGTH = 800;
const CLOSING_MARKS = new Set(["\"", "'", "”", "’", ")", "}", "]"]);

export function normalizePresentationText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function splitExplanation(value: string): string[] {
  const paragraphs = value
    .replace(/\r\n?/gu, "\n")
    .split(/\n\s*\n+/gu)
    .map(normalizePresentationText)
    .filter((paragraph) => paragraph.length > 0);
  const units = paragraphs.flatMap((paragraph) =>
    paragraph.length <= MAX_CHUNK_LENGTH
      ? [paragraph]
      : splitLongText(paragraph),
  );

  return packUnits(units);
}

function splitLongText(value: string): string[] {
  const sentences = splitAtBoundaries(value, [".", "!", "?", "…"]);

  return sentences.flatMap((sentence) => {
    if (sentence.length <= MAX_CHUNK_LENGTH) {
      return [sentence];
    }

    const clauses = splitAtBoundaries(sentence, [";", ":", ","]);
    return clauses.flatMap((clause) =>
      clause.length <= MAX_CHUNK_LENGTH ? [clause] : splitAtWords(clause),
    );
  });
}

function splitAtBoundaries(value: string, boundaries: string[]): string[] {
  const parts: string[] = [];
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (!boundaries.includes(value[index] ?? "")) {
      continue;
    }

    let end = index + 1;
    while (end < value.length && CLOSING_MARKS.has(value[end] ?? "")) {
      end += 1;
    }

    if (end === value.length || /\s/u.test(value[end] ?? "")) {
      const part = normalizePresentationText(value.slice(start, end));
      if (part) {
        parts.push(part);
      }
      start = end;
    }
  }

  const remainder = normalizePresentationText(value.slice(start));
  if (remainder) {
    parts.push(remainder);
  }

  return parts.length > 0 ? parts : [normalizePresentationText(value)];
}

function splitAtWords(value: string): string[] {
  const words = normalizePresentationText(value).split(" ");
  const parts: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > MAX_CHUNK_LENGTH) {
      parts.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function packUnits(units: string[]): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current ? `${current} ${unit}` : unit;
    const shouldStartNewChunk =
      current.length >= TARGET_CHUNK_LENGTH || candidate.length > MAX_CHUNK_LENGTH;

    if (current && shouldStartNewChunk) {
      chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
