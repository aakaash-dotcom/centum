import { NextResponse } from 'next/server';
import { SAMPLE_LEADERBOARDS } from '@/data/sampleData';
import { LeaderboardEntry } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const standard = searchParams.get('standard') || '10th';
  const phone = searchParams.get('phone') || '';
  const userName = searchParams.get('name') || '';
  const userDistrict = searchParams.get('district') || '';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'leaderboard');
      externalUrl.searchParams.set('standard', standard);
      if (phone) externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.leaderboard)) {
          // Double ensure code names never have phone numbers
          const sanitized = data.leaderboard.map((item: LeaderboardEntry) => ({
            ...item,
            name: item.name ? item.name.replace(/\d+/g, '').trim() || 'Student' : 'Student',
          }));
          return NextResponse.json({ ok: true, leaderboard: sanitized });
        }
      }
    } catch (e) {
      console.warn('Apps Script leaderboard fetch failed, falling back', e);
    }
  }

  // Fallback sample leaderboard
  const list = SAMPLE_LEADERBOARDS[standard] || SAMPLE_LEADERBOARDS['10th'];
  let leaderboard: LeaderboardEntry[] = list.map((item) => ({ ...item, me: false }));

  // Check if current user is in top 5
  if (userName) {
    const firstName = userName.split(' ')[0];
    const userIndex = leaderboard.findIndex((r) => r.name.toLowerCase() === firstName.toLowerCase());

    if (userIndex >= 0) {
      leaderboard[userIndex].me = true;
    } else {
      // Add "you" row outside top 5
      leaderboard.push({
        name: firstName,
        district: userDistrict || 'TN',
        points: 420,
        tests: 5,
        me: true,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    leaderboard,
    source: 'sample_bundle',
  });
}
