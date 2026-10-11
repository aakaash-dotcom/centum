import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  let questionsReachable = false;
  let papersReachable = false;
  let backend: 'gas' | 'census-fallback' | 'mock-fallback' = 'mock-fallback';

  if (scriptUrl && secretKey) {
    try {
      // Test GAS connectivity for questions
      const qUrl = new URL(scriptUrl);
      qUrl.searchParams.set('action', 'questions');
      qUrl.searchParams.set('key', secretKey);
      qUrl.searchParams.set('classLevel', '10');
      qUrl.searchParams.set('subject', 'maths');
      qUrl.searchParams.set('type', 'concept');
      qUrl.searchParams.set('count', '1');

      const qRes = await fetch(qUrl.toString(), { cache: 'no-store' });
      if (qRes.ok) {
        const qData = await qRes.json();
        if (qData && qData.ok) {
          questionsReachable = true;
        }
      }
    } catch {
      questionsReachable = false;
    }

    try {
      // Test GAS connectivity for papers
      const pUrl = new URL(scriptUrl);
      pUrl.searchParams.set('action', 'papers');
      pUrl.searchParams.set('key', secretKey);

      const pRes = await fetch(pUrl.toString(), { cache: 'no-store' });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.ok) {
          papersReachable = true;
        }
      }
    } catch {
      papersReachable = false;
    }

    if (questionsReachable || papersReachable) {
      backend = 'gas';
    } else {
      backend = 'census-fallback';
    }
  } else {
    // Local dev or environment without GAS credentials
    backend = 'census-fallback';
    questionsReachable = true;
    papersReachable = true;
  }

  return NextResponse.json(
    {
      ok: true,
      backend,
      questionsReachable,
      papersReachable,
      checkedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
