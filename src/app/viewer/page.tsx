import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { texts } from '@/data/texts';
import ViewerInteractiveDrawer from './ViewerInteractiveDrawer';

function extractDriveFileId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ViewerPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const rawId =
    (typeof resolvedParams.id === 'string'
      ? resolvedParams.id
      : Array.isArray(resolvedParams.id)
      ? resolvedParams.id[0]
      : '') ||
    (typeof resolvedParams.fileId === 'string'
      ? resolvedParams.fileId
      : Array.isArray(resolvedParams.fileId)
      ? resolvedParams.fileId[0]
      : '') ||
    '';

  const title =
    (typeof resolvedParams.title === 'string'
      ? resolvedParams.title
      : Array.isArray(resolvedParams.title)
      ? resolvedParams.title[0]
      : '') || 'Question Paper / Study Material';

  const subject =
    (typeof resolvedParams.subject === 'string'
      ? resolvedParams.subject
      : Array.isArray(resolvedParams.subject)
      ? resolvedParams.subject[0]
      : '') || 'Maths';

  const year =
    (typeof resolvedParams.year === 'string'
      ? resolvedParams.year
      : Array.isArray(resolvedParams.year)
      ? resolvedParams.year[0]
      : '') || '';

  const classLevel =
    (typeof resolvedParams.classLevel === 'string'
      ? resolvedParams.classLevel
      : Array.isArray(resolvedParams.classLevel)
      ? resolvedParams.classLevel[0]
      : '') ||
    (typeof resolvedParams.class === 'string'
      ? resolvedParams.class
      : Array.isArray(resolvedParams.class)
      ? resolvedParams.class[0]
      : '') ||
    '10';

  const medium =
    (typeof resolvedParams.medium === 'string'
      ? resolvedParams.medium
      : Array.isArray(resolvedParams.medium)
      ? resolvedParams.medium[0]
      : '') || 'english';

  const viewerPageType =
    (typeof resolvedParams.page === 'string'
      ? resolvedParams.page
      : Array.isArray(resolvedParams.page)
      ? resolvedParams.page[0]
      : '') || 'papers';

  const driveFileId = extractDriveFileId(rawId);
  const isPlaceholder =
    !driveFileId ||
    driveFileId.toUpperCase().includes('REPLACE') ||
    driveFileId.toUpperCase().includes('PLACEHOLDER');

  const backHref =
    viewerPageType === 'pro' || viewerPageType === 'pro-materials' ? '/pro' : '/papers';

  return (
    <div className="min-h-screen bg-[#FAF5FF] dark:bg-[#0F0618] flex flex-col">
      {/* CENTUM Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#130722]/95 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#2D124D] px-3 py-2.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF5FF] dark:bg-[#250E3F] border border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#DDD6FE] text-xs font-bold hover:bg-[#EDE9FE] dark:hover:bg-[#3B2063] transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
              {title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-[#6D28D9]/70 dark:text-[#B9A6D9]">
              <span className="font-semibold">{subject}</span>
              {year && <span>• {year}</span>}
              <span>• Class {classLevel}</span>
              <span className="uppercase font-bold">({medium})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Document Frame Area */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-5xl mx-auto w-full">
        {isPlaceholder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1B0B2E] rounded-2xl border border-dashed border-[#DDD6FE] dark:border-[#3B2063] my-4">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-bold text-[#2E1065] dark:text-[#F5F0FF]">
              Document preview not available
            </p>
            <p className="text-xs text-slate-500 mt-1">Drive file ID is missing or invalid</p>
          </div>
        ) : (
          <div className="w-full h-[72vh] sm:h-[80vh] bg-white dark:bg-[#1B0B2E] rounded-2xl overflow-hidden border border-[#EDE9FE] dark:border-[#2D124D] shadow-sm relative">
            <iframe
              src={`https://drive.google.com/file/d/${driveFileId}/preview`}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay"
              title={title}
            />
          </div>
        )}

        {/* Client Interactive Drawer: Sibling Papers & Download */}
        <ViewerInteractiveDrawer
          currentFileId={driveFileId}
          currentTitle={title}
          subject={subject}
          classLevel={classLevel}
          medium={medium}
        />
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between text-[11px] text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-auto">
        <span className="truncate pr-2">{texts.papers.attribution}</span>
        <Link
          href="/privacy"
          className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline shrink-0"
        >
          privacy 🔒
        </Link>
      </footer>
    </div>
  );
}
