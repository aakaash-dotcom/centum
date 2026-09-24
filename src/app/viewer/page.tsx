'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { SAMPLE_PAPERS } from '@/data/sampleData';
import { ArrowLeft, Download, FileText, AlertCircle } from 'lucide-react';

function ViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isRegistered, openGate, showToast } = useApp();

  const id = searchParams.get('id');
  const queryFileId = searchParams.get('fileId') || '';
  const queryTitle = searchParams.get('title');
  const querySubject = searchParams.get('subject');
  const queryYear = searchParams.get('year');

  // Look up paper by id if available to enrich details
  const paper = id ? SAMPLE_PAPERS.find((p) => p.id === id) : null;
  const driveFileId = queryFileId || paper?.driveFileId || '';
  const title = queryTitle || paper?.title || 'Question Paper';
  const subject = querySubject || paper?.subject || '';
  const year = queryYear || paper?.year || '';

  const isPlaceholder =
    !driveFileId ||
    driveFileId.trim() === '' ||
    driveFileId.toUpperCase().includes('REPLACE') ||
    driveFileId.includes('PLACEHOLDER');

  const [hasError, setHasError] = useState(isPlaceholder);
  const [isLoading, setIsLoading] = useState(!isPlaceholder);

  // If placeholder or empty, trigger graceful soon state
  useEffect(() => {
    if (isPlaceholder) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [isPlaceholder]);

  // Direct download link
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  const previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

  const handleDownload = () => {
    if (isPlaceholder) {
      showToast(texts.papers.materialSoon);
      return;
    }

    if (!isRegistered) {
      openGate(() => {
        window.open(downloadUrl, '_blank');
        showToast(texts.papers.yeThePaper);
      });
      return;
    }

    window.open(downloadUrl, '_blank');
    showToast(texts.papers.yeThePaper);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF5FF] dark:bg-[#230542] animate-fade-in transition-colors">
      {/* Viewer Header */}
      <div className="sticky top-0 z-30 p-3 sm:p-4 bg-white/95 dark:bg-[#3B0F6E]/95 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
              {title}
            </h1>
            {(subject || year) && (
              <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635] truncate">
                {subject} {year ? `· ${year}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* In-viewer ⬇ download icon button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={hasError}
          aria-label="Download file"
          className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        {hasError ? (
          /* Graceful "material lands here soon 📄" state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#3B0F6E] rounded-3xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-sm my-auto min-h-[380px]">
            <span className="text-5xl mb-4 animate-bounce-slight">📄</span>
            <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
              {texts.papers.materialSoon}
            </h2>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 mt-1 max-w-xs">
              we are formatting this paper for 100% clarity. check back in a bit!
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 min-h-[44px] px-5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-[#7C3AED]/20"
            >
              ← back to papers
            </button>
          </div>
        ) : (
          /* Embedded Drive Preview */
          <div className="flex-1 w-full min-h-[500px] sm:min-h-[620px] bg-white dark:bg-[#3B0F6E] rounded-3xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 overflow-hidden shadow-sm relative flex flex-col">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-[#3B0F6E] p-6 text-center">
                <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#230542] border-t-[#7C3AED] animate-spin mb-3" />
                <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635]">
                  opening document... ⚡
                </p>
              </div>
            )}

            <iframe
              src={previewUrl}
              title={title}
              className="w-full flex-1 border-0 min-h-[500px]"
              allow="autoplay"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Attribution & Privacy Footer */}
      <div className="px-4 py-3 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 flex items-center justify-between text-[11px] text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
        <span className="truncate pr-2">{texts.papers.attribution}</span>
        <Link
          href="/privacy"
          className="text-[#7C3AED] dark:text-[#A3E635] font-bold hover:underline shrink-0"
        >
          privacy 🔒
        </Link>
      </div>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#230542]">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B0F6E] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading viewer... ⚡</p>
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
