import { NextResponse } from 'next/server';
import { normClass, normMedium } from '@/app/api/papers/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawClass = searchParams.get('classLevel') || '10th';
    const rawMedium = searchParams.get('medium') || 'english';
    const classLevel = normClass(rawClass) || '10th';
    const medium = normMedium(rawMedium) || 'english';

    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const date = searchParams.get('date') || todayIST;

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'today-quiz');
        externalUrl.searchParams.set('classLevel', classLevel);
        externalUrl.searchParams.set('medium', medium);
        externalUrl.searchParams.set('date', date);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          // Safety: If the action returned unknown action (old deployment) or quiz is null
          if (data && data.ok) {
            const rawQuiz = data.quiz;
            const normalizedQuiz = rawQuiz
              ? {
                  date: String(rawQuiz.date || date),
                  classLevel: normClass(rawQuiz.classLevel) || classLevel,
                  medium: normMedium(rawQuiz.medium) || medium,
                  subject: String(rawQuiz.subject || ''),
                  chapter: String(rawQuiz.chapter || ''),
                  type: String(rawQuiz.type || 'oneword').toLowerCase() === 'concept' ? 'concept' : 'oneword',
                  count: Number(rawQuiz.count || 10),
                }
              : null;

            return NextResponse.json(
              {
                ok: true,
                quiz: normalizedQuiz,
                source: 'live',
              },
              {
                headers: {
                  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
                  'x-data-source': 'live',
                },
              }
            );
          }
        }

        // If Apps Script answered "unknown action" or was unavailable, hide silently
        return NextResponse.json(
          {
            ok: true,
            quiz: null,
            source: 'live-silent-hide',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
              'x-data-source': 'live-silent-hide',
            },
          }
        );
      } catch (err) {
        console.warn('Apps Script today-quiz fetch failed, hiding safely', err);
      }
    }

    // Local / Dev Fallback: If 10th English on current date, provide initial test schedule row
    const mockClass = classLevel.replace(/th/gi, '');
    if (mockClass === '10' && medium === 'english' && date === todayIST) {
      return NextResponse.json(
        {
          ok: true,
          quiz: {
            date: todayIST,
            classLevel: '10th',
            medium: 'english',
            subject: 'Mathematics',
            chapter: 'Chapter 1 - Relations and Functions',
            type: 'oneword',
            count: 15,
          },
          source: 'mock',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
            'x-data-source': 'mock',
          },
        }
      );
    }

    // Default when no schedule row exists for today
    return NextResponse.json(
      {
        ok: true,
        quiz: null,
        source: 'mock-empty',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
          'x-data-source': 'mock-empty',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: true, quiz: null, error: String(err) },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
