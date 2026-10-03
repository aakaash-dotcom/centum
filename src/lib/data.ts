import rawPapers from '@/data/papers.json';

export type Subject =
  | 'Tamil'
  | 'English'
  | 'Mathematics'
  | 'Science'
  | 'Social Science'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Botany'
  | 'Zoology'
  | 'Accountancy'
  | 'Commerce'
  | 'Economics'
  | 'History'
  | 'Geography'
  | 'Political Science'
  | 'Statistics'
  | 'Business Maths'
  | 'Computer Science'
  | 'Computer Applications'
  | 'French';

export const SUBJECTS: Subject[] = [
  'Tamil',
  'English',
  'Mathematics',
  'Science',
  'Social Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Botany',
  'Zoology',
  'Accountancy',
  'Commerce',
  'Economics',
  'History',
  'Geography',
  'Political Science',
  'Statistics',
  'Business Maths',
  'Computer Science',
  'Computer Applications',
  'French',
];

export interface PaperItem {
  id: string;
  classLevel: string | number;
  subject: Subject | string;
  exam: string;
  year: string | number;
  medium: 'Tamil' | 'English' | string;
  title: string;
  pdfUrl: string;
  featured?: boolean;
  isBilingual?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  category?: string;
  driveFileId?: string;
  plan?: string;
}

/**
 * Detects bilingual papers where two rows (em + tm, same subject/exam/year) share the same driveFileId.
 */
export function detectBilingualPapers<
  T extends {
    driveFileId?: string;
    pdfUrl?: string;
    medium?: string;
    subject?: string;
    exam?: string;
    year?: string | number;
  }
>(papers: T[]): (T & { isBilingual?: boolean })[] {
  const getFid = (p: T): string => {
    const raw = p.driveFileId || p.pdfUrl || '';
    if (!raw || raw === 'REPLACE_DRIVE_ID' || raw.includes('PLACEHOLDER')) return '';
    const m = String(raw).match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    const m2 = String(raw).match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return raw;
  };

  const groupMap = new Map<string, { em: boolean; tm: boolean }>();
  papers.forEach((p) => {
    const fid = getFid(p);
    if (!fid) return;
    const sKey = `${String(p.subject || '').trim().toLowerCase()}:::${String(p.exam || '').trim().toLowerCase()}:::${String(p.year || '').trim()}:::${fid}`;
    const med = String(p.medium || '').toLowerCase();
    const isEm = med.includes('eng');
    const isTm = med.includes('tam');

    const entry = groupMap.get(sKey);
    if (entry) {
      if (isEm) entry.em = true;
      if (isTm) entry.tm = true;
    } else {
      groupMap.set(sKey, { em: isEm, tm: isTm });
    }
  });

  const bilingualKeys = new Set<string>();
  for (const [key, entry] of groupMap.entries()) {
    if (entry.em && entry.tm) {
      bilingualKeys.add(key);
    }
  }

  return papers.map((p) => {
    const fid = getFid(p);
    const sKey = `${String(p.subject || '').trim().toLowerCase()}:::${String(p.exam || '').trim().toLowerCase()}:::${String(p.year || '').trim()}:::${fid}`;
    const isBilingual = Boolean(fid && bilingualKeys.has(sKey));
    return {
      ...p,
      isBilingual: isBilingual || (p as any).isBilingual || false,
    };
  });
}

/**
 * When two rows (em+tm, same subject/exam/year) point to the same driveFileId,
 * keep only one card in the UI so duplicate cards are never rendered.
 */
export function deduplicateBilingualPapers<
  T extends {
    id?: string;
    isBilingual?: boolean;
    driveFileId?: string;
    pdfUrl?: string;
    subject?: string;
    exam?: string;
    year?: string | number;
  }
>(papers: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const p of papers) {
    if (p.isBilingual) {
      const fid = p.driveFileId || p.pdfUrl || p.id || '';
      const key = `${String(p.subject || '').toLowerCase()}:::${String(p.exam || '').toLowerCase()}:::${String(p.year || '')}:::${fid}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }
    result.push(p);
  }

  return result;
}

/**
 * Normalizes subject names to canonical strings.
 */
export function normalizeSubjectName(subj: string): string {
  if (!subj) return '';
  const trimmed = subj.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'social' || lower === 'social science') {
    return 'Social Science';
  }
  if (lower === 'maths' || lower === 'mathematics' || lower === 'கணிதம்') {
    return 'Mathematics';
  }
  if (lower === 'tamil' || lower === 'தமிழ்') {
    return 'Tamil';
  }
  if (lower === 'english' || lower === 'ஆங்கிலம்') {
    return 'English';
  }
  return trimmed;
}

/**
 * Checks whether a subject is a language subject (Tamil or English).
 * Language papers are common to both English and Tamil medium curricula.
 */
export function isLanguageSubject(subj: string): boolean {
  if (!subj) return false;
  const s = String(subj).trim().toLowerCase();
  return (
    s === 'tamil' ||
    s === 'english' ||
    s === 'தமிழ்' ||
    s === 'ஆங்கிலம்' ||
    s.startsWith('tamil') ||
    s.startsWith('english')
  );
}

export interface PaperFilterOptions {
  classLevel?: string | number;
  category?: string;
  subject?: string;
  exam?: string;
  year?: string | number;
  medium?: string;
  showBothMediums?: boolean;
}

/**
 * Filters a list of papers based on standard, category, subject, exam, year, and medium.
 * Language subjects (Tamil, English) are treated as medium-neutral and appear under both mediums.
 */
export function filterPapers(
  papers: PaperItem[],
  filters: PaperFilterOptions = {}
): PaperItem[] {
  const {
    classLevel,
    category,
    subject,
    exam,
    year,
    medium,
    showBothMediums = false,
  } = filters;

  return papers.filter((p) => {
    // 1. Class level check (matches digits like '10th' <-> '10' <-> 10)
    if (classLevel !== undefined && classLevel !== null && classLevel !== '') {
      const pClass = String(p.classLevel || '').replace(/\D/g, '');
      const targetClass = String(classLevel).replace(/\D/g, '');
      if (pClass && targetClass && pClass !== targetClass) {
        return false;
      }
    }

    // 2. Category check (defaults to 'pyq' if paper has no category)
    if (category && category !== 'all') {
      const pCat = String(p.category || 'pyq').toLowerCase();
      if (pCat !== category.toLowerCase()) {
        return false;
      }
    }

    // 3. Subject check (normalized match)
    if (subject && subject !== 'All' && subject !== 'all') {
      const pSubj = normalizeSubjectName(String(p.subject || '')).toLowerCase();
      const targetSubj = normalizeSubjectName(subject).toLowerCase();
      if (pSubj !== targetSubj) {
        return false;
      }
    }

    // 4. Exam check
    if (exam && exam !== 'all') {
      const pExam = String(p.exam || '').trim().toLowerCase();
      const targetExam = exam.trim().toLowerCase();
      if (pExam !== targetExam && !pExam.includes(targetExam) && !targetExam.includes(pExam)) {
        return false;
      }
    }

    // 5. Year check
    if (year && year !== 'all') {
      const pYear = String(p.year || '').trim();
      const targetYear = String(year).trim();
      if (pYear !== targetYear) {
        return false;
      }
    }

    // 6. Medium check — Bug #11 & Bilingual: Language subjects (Tamil, English) and bilingual papers are common to both mediums
    if (!showBothMediums && medium && medium !== 'all') {
      const isLang = isLanguageSubject(String(p.subject || ''));
      if (!isLang && !p.isBilingual) {
        const pMed = String(p.medium || '').trim().toLowerCase();
        const targetMed = medium.trim().toLowerCase();
        if (pMed !== targetMed && !pMed.startsWith(targetMed.slice(0, 1))) {
          return false;
        }
      }
    }

    return true;
  });
}

export const allPapers: PaperItem[] = rawPapers as PaperItem[];

export function getPapers(): PaperItem[] {
  return allPapers;
}
