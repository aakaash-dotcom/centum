/**
 * src/lib/gating.ts
 * Single authoritative source for chapter access gating across Centum.
 * Rule: First three concept chapters (1, 2, 3) are FREE in English & Tamil;
 * Chapters 4+ are locked for free users and require Pro.
 */

export function isChapterAllowed(chap: unknown): boolean {
  if (!chap) return false;
  const s = String(chap).trim();

  // Handle multi-digit chapter parsing safely so "Chapter 10" is not confused with "Chapter 1"
  const match = s.match(/(?:chapter|unit|ch|அலகு|பாடம்|\b)\s*([0-9]+)\b/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 3) return true;
    if (num >= 4) return false;
  }

  // Handle leading chapter number with separator: "1. Relations", "2 - Numbers", "3: Algebra"
  const leadingMatch = s.match(/^([0-9]+)(?:\.|\s|-|:)/);
  if (leadingMatch) {
    const num = parseInt(leadingMatch[1], 10);
    if (num >= 1 && num <= 3) return true;
    if (num >= 4) return false;
  }

  return false;
}

export const isChapterOne = isChapterAllowed;
