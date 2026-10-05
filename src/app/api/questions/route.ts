import { NextResponse } from 'next/server';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';
import { isLanguageSubject } from '@/lib/data';
import {
  normalizeSubject,
  isSubjectAllowedForClassStream,
  getCanonicalSubjects,
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

export const normMedium = (v: unknown) => String(v ?? '').trim().toLowerCase(); // 'english' | 'tamil'
export const normPlan = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'pro' || s === 'live' ? s : 'free';
};

interface FilterParams {
  classLevel?: string | null;
  subject?: string | null;
  chapter?: string | null;
  type?: string | null;
  medium?: string | null;
  stream?: string | null;
  count?: string | null;
}

export function sanitizeAndFilterQuestions(rawQuestions: any[], params: FilterParams) {
  const { classLevel, subject, chapter, type, medium, stream, count } = params;
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

    // 1. Class filter (if requested)
    if (targetClassNum && qClassNum && qClassNum !== targetClassNum) {
      continue;
    }

    // 2. Canonical subject check (server-enforced, no leakage across streams)
    const effectiveClass = qClassNum || targetClassNum || '10';
    const qRawSubj = String(q.subject || '');
    const qSubj = normalizeSubject(qRawSubj);

    if (!isSubjectAllowedForClassStream(effectiveClass, qRawSubj, stream || undefined)) {
      skippedList.push({ id: qId, reason: `subject_not_allowed_for_class_stream: ${qRawSubj}` });
      continue;
    }

    // Filter by specific requested subject
    if (targetSubj && qSubj.toLowerCase() !== targetSubj && qRawSubj.toLowerCase() !== targetSubj) {
      continue;
    }

    // 3. Medium filter (Tamil and English language subjects apply to both mediums; others strict)
    const qMed = normMedium(q.medium);
    if (targetMed) {
      const isLang = isLanguageSubject(qRawSubj) || isLanguageSubject(qSubj);
      if (!isLang) {
        if (qMed !== targetMed && !qMed.startsWith(targetMed.slice(0, 1))) {
          continue;
        }
      }
    }

    // 4. Type filter (e.g. concept vs oneword)
    const qType = String(q.type || 'oneword').trim().toLowerCase();
    if (targetType && qType !== targetType) {
      continue;
    }

    // 5. Chapter filter
    if (targetChap) {
      const qChap = String(q.chapter || '').trim().toLowerCase();
      const cleanTargetChap = targetChap.replace(/^(chapter|unit|\u0B85\u0BB2\u0B95\u0BC1)\s*\d+\s*[-–.]?\s*/i, '').trim();
      const cleanQChap = qChap.replace(/^(chapter|unit|\u0B85\u0BB2\u0B95\u0BC1)\s*\d+\s*[-–.]?\s*/i, '').trim();
      if (qChap !== targetChap && cleanQChap !== cleanTargetChap && !qChap.includes(cleanTargetChap)) {
        continue;
      }
    }

    // 6. QUESTION TEXT & OPTIONS VALIDATION (Delimiter collisions & bad rows MUST be skipped, never crash)
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
      console.warn(`[QuestionsAPI] Skipping question ${qId}: invalid option count (${options.length})`);
      skippedList.push({ id: qId, reason: `invalid_options_count_${options.length}` });
      continue;
    }

    // 7. ANSWER INDEX VALIDATION (0..3 bounds)
    const ai = Number(q.answerIndex);
    if (isNaN(ai) || ai < 0 || ai > 3 || Math.floor(ai) !== ai) {
      console.warn(`[QuestionsAPI] Skipping question ${qId}: invalid answerIndex (${q.answerIndex})`);
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

  const isCountAll = String(count || '').toLowerCase() === 'all';
  const parsedCount = parseInt(count || '40', 10);
  const maxCount = isCountAll
    ? validQuestions.length
    : isNaN(parsedCount) || parsedCount <= 0
    ? 40
    : Math.min(parsedCount, 1000);
  const sliced = validQuestions.slice(0, maxCount);

  return {
    questions: sliced,
    totalMatching: validQuestions.length,
    returned: sliced.length,
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
  const count = searchParams.get('count') || '40';

  const filterParams: FilterParams = {
    classLevel,
    subject,
    chapter,
    type,
    medium,
    stream,
    count,
  };

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

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
      if (count) externalUrl.searchParams.set('count', count);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.questions)) {
          const sanitized = sanitizeAndFilterQuestions(data.questions, filterParams);

          return NextResponse.json(
            {
              ok: true,
              questions: sanitized.questions,
              totalMatching: sanitized.totalMatching,
              source: 'live',
              skipped: [...(data.skipped || []), ...sanitized.skipped],
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
              },
            }
          );
        }
      }

      console.warn('Live Apps Script questions failed or returned non-ok, falling back to mock');
    } catch (e) {
      console.warn('Apps Script questions fetch failed', e);
    }
  }

  // If in local development without direct GAS credentials, bridge to deployed live production API
  if (!scriptUrl || !secretKey) {
    try {
      const prodUrl = new URL('https://centum-omega.vercel.app/api/questions');
      if (classLevel) prodUrl.searchParams.set('classLevel', classLevel);
      if (subject) prodUrl.searchParams.set('subject', subject);
      if (chapter) prodUrl.searchParams.set('chapter', chapter);
      if (type) prodUrl.searchParams.set('type', type);
      if (medium) prodUrl.searchParams.set('medium', medium);
      if (stream) prodUrl.searchParams.set('stream', stream);
      if (count) prodUrl.searchParams.set('count', count);

      const prodRes = await fetch(prodUrl.toString(), { cache: 'no-store' });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData && prodData.ok && Array.isArray(prodData.questions)) {
          return NextResponse.json(
            {
              ...prodData,
              source: 'live-bridge',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
                'x-data-source': 'live-bridge',
                'x-cache-version': 'cdn-v1',
              },
            }
          );
        }
      }
    } catch (e) {
      console.warn('Local dev bridge to live questions failed', e);
    }
  }

  // Fallback to bundled sample questions (dev or offline fallback)
  const sanitized = sanitizeAndFilterQuestions(SAMPLE_QUESTIONS, filterParams);

  return NextResponse.json(
    {
      ok: true,
      questions: sanitized.questions,
      totalMatching: sanitized.totalMatching,
      source: 'mock-fallback',
      skipped: sanitized.skipped,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
        'x-data-source': 'mock',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
