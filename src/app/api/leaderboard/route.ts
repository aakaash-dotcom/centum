import { NextResponse } from 'next/server';
import { SAMPLE_LEADERBOARDS } from '@/data/sampleData';
import { LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawStandard = searchParams.get('standard');
  const standard = rawStandard && rawStandard.trim() !== '' && rawStandard.trim().toLowerCase() !== 'all' ? rawStandard.trim() : '';
  const phone = searchParams.get('phone') || '';
  const userName = searchParams.get('name') || '';
  const userDistrict = searchParams.get('district') || '';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const isDebug = searchParams.get('debug') === '1' || searchParams.get('trace') === '1';

      if (isDebug) {
        // Trace read-only from Apps Script
        const schemaUrl = new URL(scriptUrl);
        schemaUrl.searchParams.set('action', 'ops-schema');
        schemaUrl.searchParams.set('key', secretKey);
        const schemaRes = await fetch(schemaUrl.toString(), { cache: 'no-store' }).then(r => r.json()).catch(err => ({ error: err.message }));

        const scoresUrl = new URL(scriptUrl);
        scoresUrl.searchParams.set('action', 'ops-rows');
        scoresUrl.searchParams.set('tab', 'Scores');
        scoresUrl.searchParams.set('key', secretKey);
        const scoresRes = await fetch(scoresUrl.toString(), { cache: 'no-store' }).then(r => r.json()).catch(err => ({ error: err.message }));

        const noStdUrl = new URL(scriptUrl);
        noStdUrl.searchParams.set('action', 'leaderboard');
        noStdUrl.searchParams.set('key', secretKey);
        const noStdRes = await fetch(noStdUrl.toString(), { cache: 'no-store' }).then(r => r.json()).catch(err => ({ error: err.message }));

        const std10thUrl = new URL(scriptUrl);
        std10thUrl.searchParams.set('action', 'leaderboard');
        std10thUrl.searchParams.set('standard', '10th');
        std10thUrl.searchParams.set('key', secretKey);
        const std10thRes = await fetch(std10thUrl.toString(), { cache: 'no-store' }).then(r => r.json()).catch(err => ({ error: err.message }));

        const std10Url = new URL(scriptUrl);
        std10Url.searchParams.set('action', 'leaderboard');
        std10Url.searchParams.set('standard', '10');
        std10Url.searchParams.set('key', secretKey);
        const std10Res = await fetch(std10Url.toString(), { cache: 'no-store' }).then(r => r.json()).catch(err => ({ error: err.message }));

        return NextResponse.json({
          ok: true,
          source: 'live-trace',
          requestedStandard: searchParams.get('standard'),
          trace: {
            schema: schemaRes,
            scoresTabCount: Array.isArray(scoresRes?.rows) ? scoresRes.rows.length : 0,
            scoresSample: Array.isArray(scoresRes?.rows) ? scoresRes.rows.slice(-10) : scoresRes,
            gasLeaderboardNoStandard: noStdRes,
            gasLeaderboard10th: std10thRes,
            gasLeaderboard10: std10Res,
          }
        });
      }

      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'leaderboard');
      if (standard && standard !== 'all') {
        externalUrl.searchParams.set('standard', standard);
      }
      if (phone) externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.leaderboard)) {
          // Double ensure code names never have phone numbers
          const sanitized = data.leaderboard.map((item: LeaderboardEntry) => ({
            ...item,
            name: item.name ? item.name.replace(/\d+/g, '').trim() || 'Student' : 'Student',
          }));
          return NextResponse.json(
            {
              ok: true,
              leaderboard: sanitized,
              source: 'live',
              gasWindow: data.window || 'last-7-days',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
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
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    } catch (e) {
      console.warn('Apps Script leaderboard fetch failed', e);
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
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }
  }

  // Fallback sample leaderboard ONLY when env vars are missing entirely (dev only)
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

  return NextResponse.json(
    {
      ok: true,
      leaderboard,
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
        'x-data-source': 'mock',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
