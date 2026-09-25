import { NextResponse } from 'next/server';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

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
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.questions)) {
          return NextResponse.json(
            {
              ...data,
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60',
                'x-data-source': 'live',
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
          },
        }
      );
    }
  }

  // Fallback to bundled sample questions ONLY when env vars are missing entirely (dev only)
  let questions = SAMPLE_QUESTIONS;
  if (classLevel) {
    questions = questions.filter(
      (q) => q.classLevel.toLowerCase() === classLevel.toLowerCase()
    );
  }
  if (subject) {
    questions = questions.filter(
      (q) => q.subject.toLowerCase() === subject.toLowerCase()
    );
  }
  if (medium) {
    questions = questions.filter((q) => q.medium === medium);
  }

  return NextResponse.json(
    {
      ok: true,
      questions,
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
        'x-data-source': 'mock',
      },
    }
  );
}
