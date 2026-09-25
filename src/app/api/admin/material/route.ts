import { NextResponse } from 'next/server';
import { verifyMockAdmin, addMockMaterial } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, adminPassword, tab, row } = body || {};
    const adminPhone = normalizePhone(rawPhone) || rawPhone;

    if (!adminPhone || !adminPassword) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
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
        externalUrl.searchParams.set('password', adminPassword);
        externalUrl.searchParams.set('key', secretKey);

        const checkAuth = await fetch(externalUrl.toString(), { cache: 'no-store' });
        if (checkAuth.ok) {
          const authData = await checkAuth.json();
          if (!authData.ok || authData.error === 'Unauthorized') {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              { status: 403 }
            );
          }
        }
      } catch (err) {
        // Fall back to local mock check
      }
    }

    // Local Mock verification check
    const isValid = verifyMockAdmin(adminPhone, adminPassword);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Now validate payload fields
    if (!tab || !row || typeof row !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Tab and row data are required' },
        { status: 400 }
      );
    }

    // Required fields validation per tab
    if (tab === 'Papers') {
      if (!row.classLevel || !row.category || !row.subject || !row.title || !row.driveFileId) {
        return NextResponse.json(
          { ok: false, error: 'Missing required paper fields' },
          { status: 400 }
        );
      }
    } else if (tab === 'News') {
      if (!row.title || !row.summary || !row.category) {
        return NextResponse.json(
          { ok: false, error: 'Missing required news fields' },
          { status: 400 }
        );
      }
    } else if (tab === 'Questions') {
      if (!row.classLevel || !row.subject || !row.question || !Array.isArray(row.options) || row.options.length < 2) {
        return NextResponse.json(
          { ok: false, error: 'Missing required question fields' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid tab. Must be Papers, News, or Questions' },
        { status: 400 }
      );
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
            adminPassword,
            tab,
            row,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            addMockMaterial(tab, row);
            return NextResponse.json({ ok: true });
          }
          if (data.error === 'Unauthorized') {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              { status: 403 }
            );
          }
        }
      } catch (err) {
        // Fall back to local mock store
      }
    }

    addMockMaterial(tab, row);
    return NextResponse.json({ ok: true, source: 'mock_saved' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to add content' },
      { status: 500 }
    );
  }
}
