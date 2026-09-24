import { NextResponse } from 'next/server';
import { SAMPLE_DAILY_QUIZZES } from '@/data/sampleData';
import { DailyQuiz } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel') || '10th';
  const stream = searchParams.get('stream');
  const medium = searchParams.get('medium') || 'english';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'dailyquiz');
      externalUrl.searchParams.set('classLevel', classLevel);
      if (stream) externalUrl.searchParams.set('stream', stream);
      externalUrl.searchParams.set('medium', medium);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        // data.quiz can be a DailyQuiz object or null
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script dailyquiz fetch failed, falling back', e);
    }
  }

  // Fallback sample data
  const found = SAMPLE_DAILY_QUIZZES.find((q) => {
    const matchClass = q.classLevel.toLowerCase() === classLevel.toLowerCase();
    const matchMedium = q.medium === medium;
    const matchStream = !stream || !q.stream || q.stream.toLowerCase() === stream.toLowerCase();
    return matchClass && matchMedium && matchStream;
  });

  return NextResponse.json({
    ok: true,
    quiz: found || null,
    source: 'sample_bundle',
  });
}
