// src/data/canonicalSubjects.ts
/**
 * Single source of truth for TN State Board canonical subjects per class and stream.
 * Aligns strictly to QuestionBank and Papers catalog values.
 */

export const SUBJECT_ALIASES: Record<string, string> = {
  // Maths
  maths: 'Maths',
  mathematics: 'Maths',
  கணிதம்: 'Maths',

  // Science
  science: 'Science',
  'general science': 'Science',
  அறிவியல்: 'Science',

  // Social Science
  social: 'Social Science',
  'social science': 'Social Science',
  'சமூக அறிவியல்': 'Social Science',

  // Languages (common to all)
  tamil: 'Tamil',
  தமிழ்: 'Tamil',
  english: 'English',
  ஆங்கிலம்: 'English',

  // 11th & 12th Science / Bio subjects
  physics: 'Physics',
  இயற்பியல்: 'Physics',
  chemistry: 'Chemistry',
  வேதியியல்: 'Chemistry',
  biology: 'Biology',
  உயிரியல்: 'Biology',
  botany: 'Botany',
  தாவரவியல்: 'Botany',
  zoology: 'Zoology',
  விலங்கியல்: 'Zoology',
  'computer science': 'Computer Science',
  'கணினி அறிவியல்': 'Computer Science',

  // 11th & 12th Commerce subjects
  accountancy: 'Accountancy',
  'கணக்குப் பதிவியல்': 'Accountancy',
  commerce: 'Commerce',
  வணிகவியல்: 'Commerce',
  economics: 'Economics',
  பொருளியல்: 'Economics',
  'business maths': 'Business Maths',
  'business mathematics': 'Business Maths',
  'வணிகக் கணிதம்': 'Business Maths',
  'computer applications': 'Computer Applications',
  'கணினி பயன்பாடுகள்': 'Computer Applications',
};

export function normalizeSubject(subj: string): string {
  if (!subj) return '';
  const clean = subj.trim().toLowerCase();
  return SUBJECT_ALIASES[clean] || subj.trim();
}

export function isLanguageSubject(subj: string): boolean {
  if (!subj) return false;
  const s = subj.trim().toLowerCase();
  return (
    s === 'tamil' ||
    s === 'english' ||
    s === 'தமிழ்' ||
    s === 'ஆங்கிலம்' ||
    s.startsWith('tamil') ||
    s.startsWith('english')
  );
}

export type StreamKey = 'maths' | 'bio' | 'commerce' | 'arts' | 'general';

export function normalizeStream(rawStream?: string): StreamKey {
  if (!rawStream) return 'maths';
  const s = rawStream.toLowerCase();
  if (s.includes('bio')) return 'bio';
  if (s.includes('comm') || s.includes('acc')) return 'commerce';
  if (s.includes('art') || s.includes('hist')) return 'arts';
  if (s.includes('math')) return 'maths';
  return 'general';
}

// Canonical subject lists by class and stream
export const CANONICAL_MAP = {
  // Classes 6th to 10th: 5 core subjects
  secondary: ['Maths', 'Science', 'Social Science', 'Tamil', 'English'] as const,

  // Higher secondary (11th & 12th) by stream:
  higherSecondary: {
    // Maths stream: Maths, Physics, Chemistry + Tamil, English (+ optional Comp Sci)
    maths: ['Maths', 'Physics', 'Chemistry', 'Computer Science', 'Tamil', 'English'],

    // Bio stream: Physics, Chemistry, Botany, Zoology, Biology + Tamil, English (NO Maths/Commerce)
    bio: ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Biology', 'Tamil', 'English'],

    // Commerce stream: Accountancy, Commerce, Business Maths, Economics + Tamil, English (NO Science)
    commerce: ['Accountancy', 'Commerce', 'Business Maths', 'Economics', 'Tamil', 'English'],

    // Arts stream: History, Economics, Political Science, Tamil, English
    arts: ['Economics', 'Tamil', 'English'],

    // General fallback: core languages
    general: ['Tamil', 'English'],
  },
};

/**
 * Returns allowed canonical subjects for a given class level and optional stream.
 */
export function getCanonicalSubjects(classLevel: string | number, stream?: string): string[] {
  const digits = String(classLevel || '').replace(/\D/g, '');
  const classNum = parseInt(digits, 10);

  if (isNaN(classNum) || classNum <= 10) {
    // Classes 6th..10th
    return [...CANONICAL_MAP.secondary];
  }

  // Classes 11th & 12th
  const streamKey = normalizeStream(stream);
  const list = CANONICAL_MAP.higherSecondary[streamKey] || CANONICAL_MAP.higherSecondary.maths;
  return [...list];
}

/**
 * Checks if a subject is permitted for the given class and stream.
 */
export function isSubjectAllowedForClassStream(
  classLevel: string | number,
  subject: string,
  stream?: string
): boolean {
  if (!subject) return false;
  const norm = normalizeSubject(subject);
  const allowed = getCanonicalSubjects(classLevel, stream);
  return allowed.some((s) => s.toLowerCase() === norm.toLowerCase());
}
