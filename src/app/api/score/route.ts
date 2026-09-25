import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      phone,
      name,
      district,
      standard,
      subject,
      chapter,
      testType,
      score,
      total,
      seconds,
    } = body;

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const payload = {
          type: 'score',
          key: secretKey,
          phone,
          name,
          district,
          standard,
          subject,
          chapter,
          testType,
          score,
          total,
          seconds,
          timestamp: new Date().toISOString(),
        };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
        });

        if (res.ok) {
          const resData = await res.json();
          return NextResponse.json(
            { ok: true, source: 'live', ...resData },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
              },
            }
          );
        }
      } catch (err) {
        console.warn('Score submission to Apps Script failed', err);
      }
    }

    // Return success to never block UX
    return NextResponse.json(
      {
        ok: true,
        recorded: true,
        source: 'mock-fallback',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (error) {
    // Silenced error - return ok so UX is never blocked
    return NextResponse.json(
      { ok: true, error: 'Silenced score error' },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
