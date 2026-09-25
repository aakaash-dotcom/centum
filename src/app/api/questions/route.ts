import { NextResponse } from 'next/server';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

export const normClass = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === '10' || s === '10th') return '10th';
  if (s === '12' || s === '12th') return '12th';
  return s; // 6th–9th, 11th pass through text-normalized
};

export const normMedium = (v: unknown) => String(v ?? '').trim().toLowerCase(); // 'english' | 'tamil'
export const normPlan = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'pro' || s === 'live' ? s : 'free';
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const subject = searchParams.get('subject');
  const medium = searchParams.get('medium');

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'questions');
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.questions)) {
          const normalizedQuestions = data.questions.map((q: any) => ({
            ...q,
            classLevel: normClass(q.classLevel),
            medium: normMedium(q.medium),
            type: String(q.type ?? '').trim().toLowerCase(),
            plan: normPlan(q.plan),
          }));
          return NextResponse.json(
            {
              ...data,
              questions: normalizedQuestions,
              source: 'live',
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

      return NextResponse.json(
        {
          ok: false,
          error: 'backend-unreachable',
          source: 'live-failed',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'x-data-source': 'live-failed',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    } catch (e) {
      console.warn('Apps Script questions fetch failed', e);
      return NextResponse.json(
        {
          ok: false,
          error: 'backend-unreachable',
          source: 'live-failed',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'x-data-source': 'live-failed',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }
  }

  // Fallback to bundled sample questions ONLY when env vars are missing entirely (dev only)
  let questions = SAMPLE_QUESTIONS.map((q) => ({
    ...q,
    classLevel: normClass(q.classLevel),
    medium: normMedium(q.medium),
    type: String(q.type ?? '').trim().toLowerCase(),
    plan: normPlan(q.plan),
  }));

  if (classLevel) {
    questions = questions.filter(
      (q) => String(q.classLevel || '').toLowerCase() === classLevel.toLowerCase()
    );
  }
  if (subject) {
    questions = questions.filter(
      (q) => q.subject.toLowerCase() === subject.toLowerCase()
    );
  }
  if (medium) {
    questions = questions.filter(
      (q) => String(q.medium || '').toLowerCase() === medium.toLowerCase()
    );
  }

  return NextResponse.json(
    {
      ok: true,
      questions,
      source: 'mock-fallback',
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
