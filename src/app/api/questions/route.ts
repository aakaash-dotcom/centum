import { NextResponse } from 'next/server';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';

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
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.questions)) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn('Apps Script questions fetch failed, serving sample data', e);
    }
  }

  // Fallback to bundled sample questions
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

  return NextResponse.json({
    ok: true,
    questions,
    source: 'sample_bundle',
  });
}
