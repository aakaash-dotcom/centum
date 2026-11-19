import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeClassLevel(raw: string | null): string {
  if (!raw) return '10th';
  const s = raw.trim().toLowerCase();
  const num = s.replace(/[^0-9]/g, '');
  return num ? `${num}th` : s;
}

function matchesClass(itemClass: unknown, queryClass: string): boolean {
  if (!itemClass) return false;
  const s1 = String(itemClass).trim().toLowerCase().replace(/th$/, '');
  const s2 = queryClass.trim().toLowerCase().replace(/th$/, '');
  return s1 === s2;
}

import { normalizeSubject } from '@/data/canonicalSubjects';

function matchesSubject(itemSubject: unknown, querySubject: string): boolean {
  if (!querySubject) return true;
  if (!itemSubject) return false;
  const s1 = normalizeSubject(String(itemSubject)).trim().toLowerCase();
  const s2 = normalizeSubject(querySubject).trim().toLowerCase();
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawClass = searchParams.get('classLevel') || searchParams.get('class') || '10th';
  const classLevel = normalizeClassLevel(rawClass);
  const subject = searchParams.get('subject') || '';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'notes');
      externalUrl.searchParams.set('classLevel', classLevel);
      if (subject) externalUrl.searchParams.set('subject', subject);
      externalUrl.searchParams.set('key', secretKey);

      let res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      let data = res.ok ? await res.json() : null;

      // Fallback: If querying with specific subject returned no items, fetch all notes for this classLevel
      if (subject && (!data || !data.ok || !Array.isArray(data.items) || data.items.length === 0)) {
        const broadUrl = new URL(scriptUrl);
        broadUrl.searchParams.set('action', 'notes');
        broadUrl.searchParams.set('classLevel', classLevel);
        broadUrl.searchParams.set('key', secretKey);
        const broadRes = await fetch(broadUrl.toString(), { cache: 'no-store' });
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          if (broadData && broadData.ok && Array.isArray(broadData.items)) {
            data = broadData;
          }
        }
      }

      if (data && data.ok && Array.isArray(data.items)) {
        const filtered = data.items.filter((item: Record<string, unknown>) =>
          matchesClass(item.classLevel || item.class, classLevel) &&
          matchesSubject(item.subject, subject)
        );
        return NextResponse.json({
          ok: true,
          classLevel,
          subject,
          items: filtered,
          source: 'sheet',
          servedFrom: 'gas',
        });
      }
    } catch (e) {
      console.warn('Apps Script notes GET failed, returning empty items array', e);
    }
  }

  return NextResponse.json({
    ok: true,
    classLevel,
    subject,
    items: [],
    source: 'sheet',
    servedFrom: 'gas',
  });
}
