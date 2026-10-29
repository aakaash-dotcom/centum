import { NextResponse } from 'next/server';
import papersCatalog from '@/data/papers.json';
import lastKnownGoodQuestions from '@/data/last-known-good-questions.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  let questionsReachable = false;
  let papersReachable = false;
  let backend: 'gas' | 'last-known-good' | 'census-fallback' | 'mock-fallback' = 'last-known-good';

  let upstreamGasStatus: number | null = null;
  let upstreamGasContentType: string | null = null;
  let upstreamGasError: string | null = null;
  let upstreamGasTimingMs: number | null = null;

  if (scriptUrl && secretKey) {
    const startGas = Date.now();
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
      upstreamGasTimingMs = Date.now() - startGas;
      upstreamGasStatus = qRes.status;
      upstreamGasContentType = qRes.headers.get('content-type');

      if (qRes.ok) {
        const qData = await qRes.json().catch(() => null);
        if (qData && qData.ok) {
          questionsReachable = true;
        } else {
          upstreamGasError = qData?.error || 'gas-json-not-ok';
        }
      } else {
        upstreamGasError = `HTTP ${qRes.status} (${qRes.statusText || 'upstream-error'})`;
      }
    } catch (err: any) {
      upstreamGasTimingMs = Date.now() - startGas;
      upstreamGasError = err.message || 'fetch-failed';
      questionsReachable = false;
    }

    try {
      // Test GAS connectivity for papers
      const pUrl = new URL(scriptUrl);
      pUrl.searchParams.set('action', 'papers');
      pUrl.searchParams.set('key', secretKey);

      const pRes = await fetch(pUrl.toString(), { cache: 'no-store' });
      if (pRes.ok) {
        const pData = await pRes.json().catch(() => null);
        if (pData && pData.ok) {
          papersReachable = true;
        }
      }
    } catch {
      papersReachable = false;
    }

    if (questionsReachable && papersReachable) {
      backend = 'gas';
    } else {
      // Upstream GAS is down / 404 / cold. Verify committed durable catalogs
      const hasDurablePapers = Array.isArray(papersCatalog) && papersCatalog.length > 0;
      const hasDurableQuestions = Array.isArray(lastKnownGoodQuestions) && lastKnownGoodQuestions.length > 0;

      if (hasDurablePapers && hasDurableQuestions) {
        backend = 'last-known-good';
        questionsReachable = true;
        papersReachable = true;
      } else {
        backend = 'mock-fallback';
      }
    }
  } else {
    // Environment without GAS credentials
    const hasDurablePapers = Array.isArray(papersCatalog) && papersCatalog.length > 0;
    const hasDurableQuestions = Array.isArray(lastKnownGoodQuestions) && lastKnownGoodQuestions.length > 0;
    backend = (hasDurablePapers && hasDurableQuestions) ? 'last-known-good' : 'mock-fallback';
    questionsReachable = true;
    papersReachable = true;
  }

  return NextResponse.json(
    {
      ok: true,
      backend,
      questionsReachable,
      papersReachable,
      durableCatalogs: {
        papersCount: Array.isArray(papersCatalog) ? papersCatalog.length : 0,
        questionsCount: Array.isArray(lastKnownGoodQuestions) ? lastKnownGoodQuestions.length : 0,
      },
      upstreamGas: {
        reachable: backend === 'gas',
        status: upstreamGasStatus,
        contentType: upstreamGasContentType,
        timingMs: upstreamGasTimingMs,
        error: upstreamGasError,
      },
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
