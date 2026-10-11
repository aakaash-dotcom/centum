import { NextResponse } from 'next/server';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';
import { CENSUS_FALLBACK_QUESTIONS } from '@/lib/census-fallback';
import { isLanguageSubject } from '@/lib/data';
import {
  normalizeSubject,
  isSubjectAllowedForClassStream,
} from '@/data/canonicalSubjects';

export const dynamic = 'force-dynamic';

export const normClass = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  const digits = s.replace(/\D/g, '');
  if (['6', '7', '8', '9', '10', '11', '12'].includes(digits)) {
    return `${digits}th`;
  }
  return s;
};

export const normMedium = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (['em', 'english', 'en', 'இங்கிலீஷ்', 'ஆங்கிலம்'].includes(s)) return 'english';
  if (['tm', 'tamil', 'ta', 'தமிழ்'].includes(s)) return 'tamil';
  return s;
};

export const normPlan = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'pro' || s === 'live' ? s : 'free';
};

export function isChapterOne(chap: unknown): boolean {
  if (!chap) return false;
  const s = String(chap).trim().toLowerCase();
  if (s === '1' || s === '01') return true;
  const match = s.match(/(?:chapter|unit|ch|\b)(\d+)\b/i);
  if (match && parseInt(match[1], 10) === 1) return true;
  return s.startsWith('1.') || s.startsWith('1 -') || s.startsWith('1:');
}

export function extractPlanFromRequest(request: Request, searchParams: URLSearchParams): string {
  // 1. Query parameter
  const qPlan = searchParams.get('plan') || searchParams.get('userPlan');
  if (qPlan) return normPlan(qPlan);

  // 2. Custom headers
  const hPlan =
    request.headers.get('x-user-plan') ||
    request.headers.get('x-centum-plan') ||
    request.headers.get('x-plan');
  if (hPlan) return normPlan(hPlan);

  // 3. Cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)centum_plan=([^;]+)/);
  if (match) return normPlan(match[1]);

  return 'free';
}

interface FilterParams {
  classLevel?: string | null;
  subject?: string | null;
  chapter?: string | null;
  type?: string | null;
  medium?: string | null;
  stream?: string | null;
  count?: string | null;
  plan?: string | null;
}

export function sanitizeAndFilterQuestions(rawQuestions: any[], params: FilterParams) {
  const { classLevel, subject, chapter, type, medium, stream } = params;
  const targetClass = classLevel ? normClass(classLevel) : null;
  const targetClassNum = targetClass ? targetClass.replace(/\D/g, '') : null;
  const targetSubj = subject ? normalizeSubject(subject).toLowerCase() : null;
  const targetMed = medium ? normMedium(medium) : null;
  const targetType = type ? String(type).trim().toLowerCase() : null;
  const targetChap = chapter ? String(chapter).trim().toLowerCase() : null;

  const validQuestions: any[] = [];
  const skippedList: Array<{ id: string; reason: string }> = [];

  for (const q of rawQuestions) {
    if (!q) continue;
    const qId = String(q.id || `q-${Math.random().toString(36).slice(2, 7)}`);
    const qClass = normClass(q.classLevel || q.standard);
    const qClassNum = qClass.replace(/\D/g, '');

    // 1. Class filter
    if (targetClassNum && qClassNum && qClassNum !== targetClassNum) {
      continue;
    }

    // 2. Canonical subject check
    const effectiveClass = qClassNum || targetClassNum || '10';
    const qRawSubj = String(q.subject || '');
    const qSubj = normalizeSubject(qRawSubj);

    if (!isSubjectAllowedForClassStream(effectiveClass, qRawSubj, stream || undefined)) {
      skippedList.push({ id: qId, reason: `subject_not_allowed_for_class_stream: ${qRawSubj}` });
      continue;
    }

    if (targetSubj && qSubj.toLowerCase() !== targetSubj && qRawSubj.toLowerCase() !== targetSubj) {
      continue;
    }

    // 3. Medium filter
    const qMed = normMedium(q.medium);
    if (targetMed && targetMed !== 'all') {
      const isLang = isLanguageSubject(qRawSubj) || isLanguageSubject(qSubj);
      if (!isLang) {
        if (qMed !== targetMed) {
          continue;
        }
      }
    }

    // 4. Type filter
    const qType = String(q.type || 'oneword').trim().toLowerCase();
    if (targetType && targetType !== 'all' && qType !== targetType) {
      continue;
    }

    // 5. Chapter filter
    if (targetChap && targetChap !== 'all' && !targetChap.includes('all chapters') && !targetChap.includes('practice')) {
      const qChap = String(q.chapter || '').trim().toLowerCase();
      const cleanTargetChap = targetChap.replace(/^(chapter|unit|\u0B85\u0BB2\u0B95\u0BC1)\s*\d+\s*[-–.]?\s*/i, '').trim();
      const cleanQChap = qChap.replace(/^(chapter|unit|\u0B85\u0BB2\u0B95\u0BC1)\s*\d+\s*[-–.]?\s*/i, '').trim();
      if (qChap !== targetChap && cleanQChap !== cleanTargetChap && !qChap.includes(cleanTargetChap)) {
        continue;
      }
    }

    // 6. Question Text & Options Validation
    const questionText = String(q.question || '').trim();
    if (!questionText) {
      skippedList.push({ id: qId, reason: 'empty_question_text' });
      continue;
    }

    let options: string[] = [];
    if (Array.isArray(q.options)) {
      options = q.options.map((o: any) => String(o ?? '').trim());
    } else if (typeof q.options === 'string') {
      options = q.options.split('|').map((o: string) => o.trim());
    }

    if (options.length !== 4 || options.some((opt) => opt.length === 0)) {
      skippedList.push({ id: qId, reason: `invalid_options_count_${options.length}` });
      continue;
    }

    // 7. Answer Index Validation
    const ai = Number(q.answerIndex);
    if (isNaN(ai) || ai < 0 || ai > 3 || Math.floor(ai) !== ai) {
      skippedList.push({ id: qId, reason: `invalid_answer_index_${q.answerIndex}` });
      continue;
    }

    validQuestions.push({
      id: qId,
      classLevel: qClass || (effectiveClass ? `${effectiveClass}th` : '10th'),
      subject: qSubj,
      chapter: String(q.chapter || '').trim(),
      type: qType,
      question: questionText,
      options,
      answerIndex: ai,
      explanation: q.explanation ? String(q.explanation).trim() : '',
      medium: qMed || 'english',
      plan: normPlan(q.plan),
    });
  }

  return {
    validQuestions,
    skipped: skippedList,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel') || searchParams.get('standard');
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const type = searchParams.get('type');
  const medium = searchParams.get('medium');
  const stream = searchParams.get('stream');
  const count = searchParams.get('count');

  const callerPlan = extractPlanFromRequest(request, searchParams);
  const isPro = callerPlan === 'pro' || callerPlan === 'live';

  const filterParams: FilterParams = {
    classLevel,
    subject,
    chapter,
    type,
    medium,
    stream,
    count,
    plan: callerPlan,
  };

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  let rawQuestions: any[] | null = null;
  let upstreamTotal: number | null = null;
  let upstreamSkipped: any[] = [];
  let servedFrom: 'gas' | 'census-fallback' | 'mock-fallback' = 'gas';
  let source: 'live' | 'census-fallback' | 'mock-fallback' = 'live';

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'questions');
      externalUrl.searchParams.set('key', secretKey);
      if (classLevel) externalUrl.searchParams.set('classLevel', classLevel);
      if (subject) externalUrl.searchParams.set('subject', subject);
      if (chapter) externalUrl.searchParams.set('chapter', chapter);
      if (type) externalUrl.searchParams.set('type', type);
      if (medium) externalUrl.searchParams.set('medium', medium);
      if (stream) externalUrl.searchParams.set('stream', stream);
      // Always fetch all questions from GAS upstream so we have true sheet totals and can gate server-side
      externalUrl.searchParams.set('count', 'all');

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.questions)) {
          rawQuestions = data.questions;
          upstreamTotal = typeof data.totalMatching === 'number' ? data.totalMatching : data.questions.length;
          upstreamSkipped = Array.isArray(data.skipped) ? data.skipped : [];
          servedFrom = 'gas';
          source = 'live';
        }
      }
    } catch (e) {
      console.warn('Apps Script questions fetch failed', e);
    }
  }

  // If in local development without direct GAS credentials, bridge to deployed live production API
  if (!rawQuestions && (!scriptUrl || !secretKey)) {
    try {
      const prodUrl = new URL('https://centum-omega.vercel.app/api/questions');
      if (classLevel) prodUrl.searchParams.set('classLevel', classLevel);
      if (subject) prodUrl.searchParams.set('subject', subject);
      if (chapter) prodUrl.searchParams.set('chapter', chapter);
      if (type) prodUrl.searchParams.set('type', type);
      if (medium) prodUrl.searchParams.set('medium', medium);
      if (stream) prodUrl.searchParams.set('stream', stream);
      // Pass pro plan to prod bridge if caller has pro
      if (isPro) prodUrl.searchParams.set('plan', 'pro');
      prodUrl.searchParams.set('count', 'all');

      const prodRes = await fetch(prodUrl.toString(), { cache: 'no-store' });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (
          prodData &&
          prodData.ok &&
          Array.isArray(prodData.questions) &&
          prodData.servedFrom === 'gas' &&
          (prodData.totalMatching || prodData.questions.length) >= 50
        ) {
          rawQuestions = prodData.questions;
          upstreamTotal = prodData.totalMatching ?? prodData.sheetTotal ?? prodData.questions.length;
          servedFrom = 'gas';
          source = 'live';
        }
      }
    } catch (e) {
      console.warn('Local dev bridge to live questions failed', e);
    }
  }

  // Fallback to bundled sample questions + census fallback pool ONLY on genuine failure or cold upstream
  if (!rawQuestions) {
    rawQuestions = [...SAMPLE_QUESTIONS, ...CENSUS_FALLBACK_QUESTIONS];
    servedFrom = 'census-fallback';
    source = 'census-fallback';
  }

  const { validQuestions, skipped } = sanitizeAndFilterQuestions(rawQuestions, filterParams);
  const trueSheetTotal = upstreamTotal !== null ? upstreamTotal : validQuestions.length;

  // BLOCKER 2: Enforce Plan Check Server-Side
  // Free / unauthenticated callers may only receive Chapter 1 rows for concept questions.
  // Locked chapters return metadata only (chapter, count, locked: true) — NEVER options/answerIndex/explanation.
  let allowedQuestions: any[] = [];
  const lockedChaptersMap = new Map<string, number>();

  for (const q of validQuestions) {
    const isConcept = q.type === 'concept';
    if (!isConcept || isPro || isChapterOne(q.chapter)) {
      allowedQuestions.push(q);
    } else {
      // Locked concept question from chapters 2–8
      const chKey = String(q.chapter || 'Chapter 2').trim();
      lockedChaptersMap.set(chKey, (lockedChaptersMap.get(chKey) || 0) + 1);
    }
  }

  const lockedChapters = Array.from(lockedChaptersMap.entries()).map(([ch, cnt]) => ({
    chapter: ch,
    count: cnt,
    locked: true,
  }));

  // Apply count slicing to allowed questions
  const isCountAll = !count || String(count).toLowerCase() === 'all';
  const parsedCount = parseInt(count || '0', 10);
  const finalQuestions =
    isCountAll || isNaN(parsedCount) || parsedCount <= 0
      ? allowedQuestions
      : allowedQuestions.slice(0, Math.min(parsedCount, 1000));

  return NextResponse.json(
    {
      ok: true,
      questions: finalQuestions,
      totalMatching: allowedQuestions.length,
      returnedCount: finalQuestions.length,
      sheetTotal: trueSheetTotal,
      plan: callerPlan,
      isPro,
      lockedChapters: lockedChapters.length > 0 ? lockedChapters : undefined,
      servedFrom,
      source,
      skipped: [...upstreamSkipped, ...skipped],
    },
    {
      headers: {
        'Cache-Control':
          isPro
            ? 'private, no-cache, no-store, max-age=0'
            : 'public, s-maxage=60, stale-while-revalidate=240',
        'x-data-source': source,
        'x-served-from': servedFrom,
        'x-cache-version': 'cdn-v2',
      },
    }
  );
}
