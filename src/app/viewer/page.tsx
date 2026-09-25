'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { ArrowLeft, Download, FileText } from 'lucide-react';

function extractDriveFileId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

function ViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isRegistered, openGate, showToast } = useApp();

  const queryFileId = searchParams.get('fileId') || '';
  const title = searchParams.get('title') || 'Question Paper';
  const subject = searchParams.get('subject') || '';
  const year = searchParams.get('year') || '';

  const driveFileId = extractDriveFileId(queryFileId);

  const isPlaceholder =
    !driveFileId ||
    driveFileId.trim() === '' ||
    driveFileId.toUpperCase().includes('REPLACE') ||
    driveFileId.toUpperCase().includes('PLACEHOLDER');

  const [hasError, setHasError] = useState(isPlaceholder);
  const [isLoading, setIsLoading] = useState(!isPlaceholder);
  const [lineIndex, setLineIndex] = useState(0);

  // If placeholder or empty, trigger graceful soon state
  useEffect(() => {
    if (isPlaceholder) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [isPlaceholder]);

  // Fun cycling loading lines every 1.6s
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % 4);
    }, 1600);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Direct same-tab download link
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  const previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

  const handleDownload = () => {
    if (isPlaceholder) {
      showToast(texts.papers.materialSoon);
      return;
    }

    const triggerDownload = () => {
      try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${title || 'centum-paper'}.pdf`;
        link.setAttribute('target', '_self');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.location.href = downloadUrl;
      }
      showToast(texts.papers.yeThePaper);
    };

    if (!isRegistered) {
      openGate(() => {
        triggerDownload();
      });
      return;
    }

    triggerDownload();
  };

  const funLines = (texts.viewer.funLines as unknown as string[]) || [
    'warming up the paper 🥵',
    'bribing the pdf gods 🙏',
    'almost there, breathe 😮💨',
    'this one had 100 written all over it 📝',
  ];
  const currentLine = funLines[lineIndex % funLines.length] || funLines[0];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF5FF] dark:bg-[#0F0618] animate-fade-in transition-colors">
      {/* Viewer Header - ONLY our toolbar */}
      <div className="sticky top-0 z-30 p-3 sm:p-4 bg-white/95 dark:bg-[#1B0B2E]/95 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#3B2063] transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-[#2E1065] dark:text-[#F5F0FF] truncate leading-tight">
              {title}
            </h1>
            {(subject || year) && (
              <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] truncate">
                {subject} {year ? `· ${year}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* In-viewer ⬇ direct same-tab download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={hasError}
          aria-label="Download file"
          className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-[#18181B] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        {hasError ? (
          /* Graceful "material lands here soon 📄" state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] shadow-sm my-auto min-h-[380px]">
            <span className="text-5xl mb-4 animate-bounce-slight">📄</span>
            <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
              {texts.papers.materialSoon}
            </h2>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-1 max-w-xs">
              we are formatting this paper for 100% clarity. check back in a bit!
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 min-h-[44px] px-5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-[#7C3AED]/20"
            >
              ← {texts.viewer.back}
            </button>
          </div>
        ) : (
          /* Embedded Drive Preview with top bar clipped + popout overlay blocker */
          <div className="flex-1 w-full min-h-[520px] sm:min-h-[640px] bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] overflow-hidden shadow-sm relative flex flex-col">
            {/* Fun Animated Loader while drive embed loads */}
            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white dark:bg-[#1B0B2E] p-6 text-center animate-fade-in">
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 dark:bg-purple-500/30 animate-ping absolute" />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center text-2xl shadow-lg shadow-[#7C3AED]/40 animate-pulse">
                    🔥
                  </div>
                </div>

                <p className="text-sm font-black text-[#7C3AED] dark:text-[#A78BFA] transition-all duration-300 min-h-[24px]">
                  {currentLine}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#F472B6] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Top-Right Drive Popout Blocker (prevents external window hijacking) */}
            <div
              className="absolute top-0 right-0 w-36 h-14 z-20 pointer-events-auto cursor-default bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              title=""
              aria-hidden="true"
            />

            {/* Clipped iframe container hiding the Drive header strip */}
            <div className="w-full flex-1 min-h-[520px] overflow-hidden relative">
              <iframe
                src={previewUrl}
                title={title}
                className="w-full h-[calc(100%+52px)] -mt-[52px] border-0 min-h-[572px]"
                allow="autoplay"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Attribution & Privacy Footer */}
      <div className="px-4 py-3 border-t border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between text-[11px] text-[#6D28D9]/70 dark:text-[#B9A6D9]">
        <span className="truncate pr-2">{texts.papers.attribution}</span>
        <Link
          href="/privacy"
          className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline shrink-0"
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618]">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">loading viewer... ⚡</p>
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
