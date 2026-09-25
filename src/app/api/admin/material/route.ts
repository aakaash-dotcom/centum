import { NextResponse } from 'next/server';
import { verifyMockAdmin, addMockMaterial } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';
import { normClass } from '@/app/api/papers/route';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, adminPassword, tab, row } = body || {};
    const adminPhone = normalizePhone(rawPhone) || (typeof rawPhone === 'string' ? rawPhone.trim() : '');
    const cleanPassword = typeof adminPassword === 'string' ? adminPassword.trim() : '';

    if (!adminPhone || !cleanPassword) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    // Verify authentication credentials FIRST
    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'stats');
        externalUrl.searchParams.set('phone', adminPhone);
        externalUrl.searchParams.set('password', cleanPassword);
        externalUrl.searchParams.set('key', secretKey);

        const checkAuth = await fetch(externalUrl.toString(), { cache: 'no-store' });
        if (checkAuth.ok) {
          const authData = await checkAuth.json();
          if (!authData.ok || authData.error === 'Unauthorized') {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              {
                status: 403,
                headers: { 'Cache-Control': 'private, no-store' },
              }
            );
          }
        } else {
          return NextResponse.json(
            { ok: false, error: 'backend-unreachable', source: 'live-failed' },
            {
              status: 503,
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live-failed',
              },
            }
          );
        }
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: 'backend-unreachable', source: 'live-failed' },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      }
    } else {
      // Local Mock verification check
      const isValid = verifyMockAdmin(adminPhone, cleanPassword);
      if (!isValid) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized' },
          {
            status: 403,
            headers: { 'Cache-Control': 'private, no-store' },
          }
        );
      }
    }

    // Now validate payload fields
    if (!tab || !row || typeof row !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Tab and row data are required' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    // Required fields validation per tab
    if (tab === 'Papers') {
      if (!row.classLevel || !row.category || !row.subject || !row.title || !row.driveFileId) {
        return NextResponse.json(
          { ok: false, error: 'Missing required paper fields' },
          {
            status: 400,
            headers: { 'Cache-Control': 'private, no-store' },
          }
        );
      }
    } else if (tab === 'News') {
      if (!row.title || !row.summary || !row.category) {
        return NextResponse.json(
          { ok: false, error: 'Missing required news fields' },
          {
            status: 400,
            headers: { 'Cache-Control': 'private, no-store' },
          }
        );
      }
    } else if (tab === 'Questions') {
      if (!row.classLevel || !row.subject || !row.question || !Array.isArray(row.options) || row.options.length < 2) {
        return NextResponse.json(
          { ok: false, error: 'Missing required question fields' },
          {
            status: 400,
            headers: { 'Cache-Control': 'private, no-store' },
          }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid tab. Must be Papers, News, or Questions' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    if (row && row.classLevel) {
      row.classLevel = normClass(row.classLevel);
    }

    // Restrict plan dropdown to free or pro
    if (row.plan && row.plan !== 'free' && row.plan !== 'pro') {
      row.plan = 'free';
    }

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'admin-material',
            key: secretKey,
            adminPhone,
            adminPassword: cleanPassword,
            tab,
            row,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            addMockMaterial(tab, row);
            return NextResponse.json(
              { ok: true, source: 'live' },
              {
                headers: {
                  'Cache-Control': 'private, no-store',
                  'x-data-source': 'live',
                },
              }
            );
          }
          if (data.error === 'Unauthorized') {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              {
                status: 403,
                headers: { 'Cache-Control': 'private, no-store' },
              }
            );
          }
        }
        return NextResponse.json(
          { ok: false, error: 'backend-unreachable', source: 'live-failed' },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: 'backend-unreachable', source: 'live-failed' },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      }
    }

    addMockMaterial(tab, row);
    return NextResponse.json(
      { ok: true, source: 'mock-fallback' },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to add content' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
