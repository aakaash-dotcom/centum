/**
 * src/lib/gating.ts
 * Single authoritative source for chapter access gating across Centum.
 * Rule: First three concept chapters (1, 2, 3) are FREE in English & Tamil;
 * Chapters 4+ are locked for free users and require Pro.
 */

/**
 * Resolves chapter number (1, 2, 3...) from either numeric prefixes or canonical chapter titles.
 */
export function extractChapterNumber(chap: unknown): number | null {
  if (!chap) return null;
  const s = String(chap).trim();
  if (!s) return null;

  // 1. Explicit keyword prefix: "Chapter 1", "Ch 2", "Unit 3", "அலகு 1", "பாடம் 1", "History 1"
  const match = s.match(/(?:chapter|unit|ch|அலகு|பாடம்|history|geography|civics|economics|வரலாறு|புவியியல்|குடிமையியல்|பொருளியல்)\s*([0-9]+)\b/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) return num;
  }

  // 2. Pure number or leading number: "1", "1. Relations", "2 - Numbers", "3: Algebra"
  const leadingMatch = s.match(/^([0-9]+)(?:\s*[-–:.]|\s|$)/);
  if (leadingMatch) {
    const num = parseInt(leadingMatch[1], 10);
    if (!isNaN(num)) return num;
  }

  // 3. Any isolated number within the string
  const anyNumMatch = s.match(/\b([0-9]+)\b/);
  if (anyNumMatch) {
    const num = parseInt(anyNumMatch[1], 10);
    if (!isNaN(num)) return num;
  }

  const lower = s.toLowerCase();

  // Known Class 10 Chapter 1 titles
  if (
    lower.includes('relation') ||
    lower.includes('சார்புகள') ||
    lower.includes('உறவுகள') ||
    lower.includes('motion') ||
    lower.includes('இயக்க') ||
    lower.includes('outbreak of world war') ||
    lower.includes('world war i') ||
    lower.includes('முதல் உலகப்போர்') ||
    lower.includes('relief and drainage') ||
    lower.includes('location, relief') ||
    lower.includes('நிலத்தோற்றம்') ||
    lower.includes('constitution') ||
    lower.includes('அரசியலமைப்பு') ||
    lower.includes('gross domestic product') ||
    lower.includes('மொத்த உள்நாட்டு உற்பத்தி')
  ) {
    return 1;
  }

  // Known Class 10 Chapter 2 titles
  if (
    lower.includes('numbers and sequences') ||
    lower.includes('sequences') ||
    lower.includes('எண்களும் தொடர்வரிசைகளும்') ||
    lower.includes('தொடர்வரிசை') ||
    lower.includes('optics') ||
    lower.includes('ஒளியியல்') ||
    lower.includes('between two world wars') ||
    lower.includes('இரு உலகப்போர்களுக்கு') ||
    lower.includes('natural vegetation') ||
    lower.includes('தாவரங்கள்') ||
    lower.includes('central government') ||
    lower.includes('நடுவண் அரசு') ||
    lower.includes('globalization') ||
    lower.includes('உலகமயமாதல்')
  ) {
    return 2;
  }

  // Known Class 10 Chapter 3 titles
  if (
    lower.includes('algebra') ||
    lower.includes('இயற்கணிதம்') ||
    lower.includes('thermal physics') ||
    lower.includes('வெப்ப இயற்பியல்') ||
    lower.includes('world war ii') ||
    lower.includes('world war 2') ||
    lower.includes('இரண்டாம் உலகப்போர்') ||
    lower.includes('agriculture') ||
    lower.includes('வேளாண்மை') ||
    lower.includes('state government') ||
    lower.includes('மாநில அரசு') ||
    lower.includes('food security') ||
    lower.includes('உணவு பாதுகாப்பு')
  ) {
    return 3;
  }

  // Known Class 10 Chapter 4 titles
  if (
    lower.includes('geometry') ||
    lower.includes('வடிவியல்') ||
    lower.includes('electricity') ||
    lower.includes('மின்னோட்டவியல்') ||
    lower.includes('world after world war') ||
    lower.includes('இரண்டாம் உலகப்போருக்குப் பிந்தைய') ||
    lower.includes('industries') ||
    lower.includes('தொழிலகங்கள்') ||
    lower.includes('foreign policy') ||
    lower.includes('வெளியுறவுக் கொள்கை') ||
    lower.includes('government and taxes') ||
    lower.includes('அரசாங்கமும் வரிகளும்')
  ) {
    return 4;
  }

  return null;
}

export function isChapterAllowed(chap: unknown): boolean {
  if (!chap) return false;
  const num = extractChapterNumber(chap);
  if (num !== null) {
    return num >= 1 && num <= 3;
  }
  return false;
}

export function isChapterOne(chap: unknown): boolean {
  if (!chap) return false;
  const num = extractChapterNumber(chap);
  return num === 1;
}
