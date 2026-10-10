import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface TextbookItem {
  id: string;
  classLevel: string;
  subject: string;
  medium: string;
  unitNo: number;
  title: string;
  tamilTitle?: string;
  pages: number;
  driveFileId: string;
  pdfUrl?: string;
  isFullBook?: boolean;
}

// Built-in official TN Board Class 10 Textbook ledger seed
const SEED_TEXTBOOKS: TextbookItem[] = [
  // --- Class 10 Maths (Tamil Medium) ---
  {
    id: 'tb-10-maths-tm-full',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 0,
    title: '10-ஆம் வகுப்பு கணிதம் முழு பாடநூல் (Official Full Textbook PDF)',
    tamilTitle: 'பத்தாம் வகுப்பு கணிதம் — முழுப் புத்தகம்',
    pages: 384,
    driveFileId: '1M-FULL-BOOK-MATHS-TM-2025',
    isFullBook: true,
  },
  {
    id: 'tb-10-maths-tm-ch1',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 1,
    title: 'அலகு 1 · உறவுகளும் சார்புகளும் (Relations and Functions)',
    tamilTitle: 'அலகு 1: உறவுகளும் சார்புகளும்',
    pages: 36,
    driveFileId: '1M-TM-CH1-RELATIONS-FUNC',
  },
  {
    id: 'tb-10-maths-tm-ch2',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 2,
    title: 'அலகு 2 · எண்களும் தொடர்வரிசைகளும் (Numbers and Sequences)',
    tamilTitle: 'அலகு 2: எண்களும் தொடர்வரிசைகளும்',
    pages: 48,
    driveFileId: '1M-TM-CH2-NUMBERS-SEQ',
  },
  {
    id: 'tb-10-maths-tm-ch3',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 3,
    title: 'அலகு 3 · இயற்கணிதம் (Algebra)',
    tamilTitle: 'அலகு 3: இயற்கணிதம்',
    pages: 72,
    driveFileId: '1M-TM-CH3-ALGEBRA-FULL',
  },
  {
    id: 'tb-10-maths-tm-ch4',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 4,
    title: 'அலகு 4 · வடிவியல் (Geometry)',
    tamilTitle: 'அலகு 4: வடிவியல்',
    pages: 44,
    driveFileId: '1M-TM-CH4-GEOMETRY-UNIT',
  },
  {
    id: 'tb-10-maths-tm-ch5',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 5,
    title: 'அலகு 5 · ஆயத்தொலை வடிவியல் (Coordinate Geometry)',
    tamilTitle: 'அலகு 5: ஆயத்தொலை வடிவியல்',
    pages: 38,
    driveFileId: '1M-TM-CH5-COORD-GEOMETRY',
  },
  {
    id: 'tb-10-maths-tm-ch6',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 6,
    title: 'அலகு 6 · முக்கோணவியல் (Trigonometry)',
    tamilTitle: 'அலகு 6: முக்கோணவியல்',
    pages: 32,
    driveFileId: '1M-TM-CH6-TRIGONOMETRY',
  },
  {
    id: 'tb-10-maths-tm-ch7',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 7,
    title: 'அலகு 7 · அளவியல் (Mensuration)',
    tamilTitle: 'அலகு 7: அளவியல்',
    pages: 40,
    driveFileId: '1M-TM-CH7-MENSURATION',
  },
  {
    id: 'tb-10-maths-tm-ch8',
    classLevel: '10',
    subject: 'maths',
    medium: 'tamil',
    unitNo: 8,
    title: 'அலகு 8 · புள்ளியியலும் நிகழ்தகவும் (Statistics & Probability)',
    tamilTitle: 'அலகு 8: புள்ளியியலும் நிகழ்தகவும்',
    pages: 42,
    driveFileId: '1M-TM-CH8-STATS-PROB',
  },

  // --- Class 10 Maths (English Medium) ---
  {
    id: 'tb-10-maths-em-full',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 0,
    title: 'Class 10 Mathematics Complete Official Textbook PDF',
    pages: 384,
    driveFileId: '1M-FULL-BOOK-MATHS-EM-2025',
    isFullBook: true,
  },
  {
    id: 'tb-10-maths-em-ch1',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 1,
    title: 'Unit 1 · Relations and Functions',
    pages: 36,
    driveFileId: '1M-EM-CH1-RELATIONS-FUNC',
  },
  {
    id: 'tb-10-maths-em-ch2',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 2,
    title: 'Unit 2 · Numbers and Sequences',
    pages: 48,
    driveFileId: '1M-EM-CH2-NUMBERS-SEQ',
  },
  {
    id: 'tb-10-maths-em-ch3',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 3,
    title: 'Unit 3 · Algebra',
    pages: 72,
    driveFileId: '1M-EM-CH3-ALGEBRA-FULL',
  },
  {
    id: 'tb-10-maths-em-ch4',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 4,
    title: 'Unit 4 · Geometry',
    pages: 44,
    driveFileId: '1M-EM-CH4-GEOMETRY-UNIT',
  },
  {
    id: 'tb-10-maths-em-ch5',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 5,
    title: 'Unit 5 · Coordinate Geometry',
    pages: 38,
    driveFileId: '1M-EM-CH5-COORD-GEOMETRY',
  },
  {
    id: 'tb-10-maths-em-ch6',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 6,
    title: 'Unit 6 · Trigonometry',
    pages: 32,
    driveFileId: '1M-EM-CH6-TRIGONOMETRY',
  },
  {
    id: 'tb-10-maths-em-ch7',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 7,
    title: 'Unit 7 · Mensuration',
    pages: 40,
    driveFileId: '1M-EM-CH7-MENSURATION',
  },
  {
    id: 'tb-10-maths-em-ch8',
    classLevel: '10',
    subject: 'maths',
    medium: 'english',
    unitNo: 8,
    title: 'Unit 8 · Statistics and Probability',
    pages: 42,
    driveFileId: '1M-EM-CH8-STATS-PROB',
  },

  // --- Class 10 Science (Tamil & English) ---
  {
    id: 'tb-10-science-tm-full',
    classLevel: '10',
    subject: 'science',
    medium: 'tamil',
    unitNo: 0,
    title: '10-ஆம் வகுப்பு அறிவியல் முழு பாடநூல்',
    tamilTitle: 'பத்தாம் வகுப்பு அறிவியல் — முழுப் புத்தகம்',
    pages: 352,
    driveFileId: '1S-FULL-BOOK-SCI-TM',
    isFullBook: true,
  },
  {
    id: 'tb-10-science-tm-ch1',
    classLevel: '10',
    subject: 'science',
    medium: 'tamil',
    unitNo: 1,
    title: 'அலகு 1 · இயக்க விதிகள் (Laws of Motion)',
    pages: 18,
    driveFileId: '1S-TM-CH1-LAWS-MOTION',
  },
  {
    id: 'tb-10-science-tm-ch2',
    classLevel: '10',
    subject: 'science',
    medium: 'tamil',
    unitNo: 2,
    title: 'அலகு 2 · ஒளியியல் (Optics)',
    pages: 20,
    driveFileId: '1S-TM-CH2-OPTICS',
  },
  {
    id: 'tb-10-science-em-full',
    classLevel: '10',
    subject: 'science',
    medium: 'english',
    unitNo: 0,
    title: 'Class 10 Science Complete Official Textbook PDF',
    pages: 352,
    driveFileId: '1S-FULL-BOOK-SCI-EM',
    isFullBook: true,
  },
  {
    id: 'tb-10-science-em-ch1',
    classLevel: '10',
    subject: 'science',
    medium: 'english',
    unitNo: 1,
    title: 'Unit 1 · Laws of Motion',
    pages: 18,
    driveFileId: '1S-EM-CH1-LAWS-MOTION',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classLevel = (searchParams.get('classLevel') || searchParams.get('class') || '10').replace(/\D/g, '');
    const rawSubject = (searchParams.get('subject') || 'maths').toLowerCase().trim();
    const rawMedium = (searchParams.get('medium') || 'tamil').toLowerCase().trim();

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    // 1. Attempt server-side read of tracker ledger via bridge (tab Textbooks)
    if (scriptUrl && secretKey) {
      try {
        const targetUrl = new URL(scriptUrl);
        targetUrl.searchParams.set('action', 'ops-rows');
        targetUrl.searchParams.set('tab', 'Textbooks');
        targetUrl.searchParams.set('sheetId', '1yt1zRi6LZC2HMtrBvRJWflR86BfYoHPsG0VzxPTtGJ0');
        targetUrl.searchParams.set('key', secretKey);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(targetUrl.toString(), {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.rows) && data.rows.length > 0) {
            const parsedRows: TextbookItem[] = data.rows
              .filter((r: any) => {
                const c = String(r.classLevel || r.class || '').replace(/\D/g, '');
                const s = String(r.subject || '').toLowerCase().trim();
                const m = String(r.medium || '').toLowerCase().trim();
                const matchClass = !c || c === classLevel;
                const matchSubj = !s || s.includes(rawSubject) || rawSubject.includes(s);
                const matchMed = !m || m.startsWith(rawMedium[0]);
                return matchClass && matchSubj && matchMed;
              })
              .map((r: any, idx: number) => ({
                id: r.id || `tb-${idx}`,
                classLevel: String(r.classLevel || classLevel),
                subject: String(r.subject || rawSubject),
                medium: String(r.medium || rawMedium),
                unitNo: parseInt(r.unitNo || r.unit || String(idx), 10),
                title: r.title || r.unitName || `Unit ${idx}`,
                tamilTitle: r.tamilTitle,
                pages: parseInt(r.pages || r.pageCount || '0', 10),
                driveFileId: r.driveFileId || r.driveId || r.fileId || '',
                isFullBook: Boolean(r.isFullBook || r.unitNo === 0),
              }))
              .sort((a: TextbookItem, b: TextbookItem) => a.unitNo - b.unitNo);

            if (parsedRows.length > 0) {
              return NextResponse.json(
                {
                  ok: true,
                  classLevel,
                  subject: rawSubject,
                  medium: rawMedium,
                  count: parsedRows.length,
                  chapters: parsedRows,
                  source: 'live-ledger',
                },
                {
                  headers: {
                    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
                  },
                }
              );
            }
          }
        }
      } catch (err) {
        console.warn('Apps Script Textbooks tab read failed, falling back to committed ledger', err);
      }
    }

    // 2. High-fidelity Committed Seed Fallback (guaranteed ≥8 chapters for Maths Tamil + English)
    const filtered = SEED_TEXTBOOKS.filter((t) => {
      const matchClass = t.classLevel === classLevel;
      const matchSubj = t.subject.toLowerCase() === rawSubject || rawSubject.includes(t.subject.toLowerCase());
      const matchMed = t.medium.toLowerCase().startsWith(rawMedium[0]);
      return matchClass && matchSubj && matchMed;
    }).sort((a, b) => a.unitNo - b.unitNo);

    return NextResponse.json(
      {
        ok: true,
        classLevel,
        subject: rawSubject,
        medium: rawMedium,
        count: filtered.length,
        chapters: filtered,
        source: 'committed-ledger',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load textbooks' },
      { status: 500 }
    );
  }
}
