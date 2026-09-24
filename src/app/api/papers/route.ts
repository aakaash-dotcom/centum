import { NextResponse } from 'next/server';
import { SAMPLE_PAPERS } from '@/data/sampleData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const medium = searchParams.get('medium');

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'papers');
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.papers)) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn('Apps Script papers fetch failed, serving sample data', e);
    }
  }

  // Fallback to bundled sample data
  let papers = SAMPLE_PAPERS;
  if (classLevel) {
    papers = papers.filter(
      (p) => p.classLevel.toLowerCase() === classLevel.toLowerCase()
    );
  }
  if (medium) {
    papers = papers.filter((p) => p.medium === medium);
  }

  return NextResponse.json({
    ok: true,
    papers,
    source: 'sample_bundle',
  });
}
