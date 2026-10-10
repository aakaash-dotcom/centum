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
  const { isRegistered, openGate, showToast, medium: appMedium } = useApp();

  const queryFileId = searchParams.get('id') || searchParams.get('fileId') || '';
  const initialTitle = searchParams.get('title') || 'Question Paper / Study Material';
  const initialSubject = searchParams.get('subject') || 'Maths';
  const initialYear = searchParams.get('year') || '';
  const initialClass = searchParams.get('classLevel') || searchParams.get('class') || '10';
  const initialMedium = searchParams.get('medium') || appMedium || 'english';
  const viewerPageType = searchParams.get('page') || 'papers';

  const [activeFileId, setActiveFileId] = useState(queryFileId);
  const [activeTitle, setActiveTitle] = useState(initialTitle);
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [activeYear, setActiveYear] = useState(initialYear);
  const [siblingPapers, setSiblingPapers] = useState<any[]>([]);

  useEffect(() => {
    if (queryFileId) setActiveFileId(queryFileId);
    if (initialTitle) setActiveTitle(initialTitle);
    if (initialSubject) setActiveSubject(initialSubject);
    if (initialYear) setActiveYear(initialYear);
  }, [queryFileId, initialTitle, initialSubject, initialYear]);

  const driveFileId = extractDriveFileId(activeFileId);

  const isPlaceholder =
    !driveFileId ||
    driveFileId.trim() === '' ||
    driveFileId.toUpperCase().includes('REPLACE') ||
    driveFileId.toUpperCase().includes('PLACEHOLDER');

  const [hasError, setHasError] = useState(isPlaceholder);
  const [isLoading, setIsLoading] = useState(!isPlaceholder);
  const [lineIndex, setLineIndex] = useState(0);

  // Fetch sibling papers/materials in same subject for instant swap
  useEffect(() => {
    async function fetchSiblings() {
      try {
        const res = await fetch(`/api/papers?classLevel=${encodeURIComponent(initialClass)}&subject=${encodeURIComponent(activeSubject)}&medium=${encodeURIComponent(initialMedium)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.papers)) {
            // Exclude current paper
            const others = data.papers.filter((p: any) => {
              const pId = extractDriveFileId(p.pdfUrl || p.driveFileId || p.id || '');
              return pId !== driveFileId;
            }).slice(0, 8);
            setSiblingPapers(others);
          }
        }
      } catch (err) {
        console.warn('Failed to load sibling papers', err);
      }
    }
    fetchSiblings();
  }, [activeSubject, initialClass, initialMedium, driveFileId]);

  useEffect(() => {
    if (isPlaceholder) {
      setHasError(true);
      setIsLoading(false);
    } else {
      setHasError(false);
      setIsLoading(true);
    }
  }, [driveFileId, isPlaceholder]);

  // Cycling loading indicator
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % 4);
    }, 1600);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Direct same-tab download
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
        link.download = `${activeTitle || 'centum-document'}.pdf`;
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

  const handleSwapDocument = (item: any) => {
    const nextFileId = item.pdfUrl || item.driveFileId || item.id || '';
    setActiveFileId(nextFileId);
    setActiveTitle(item.title || 'Question Paper');
    if (item.subject) setActiveSubject(item.subject);
    if (item.year) setActiveYear(String(item.year));
    setIsLoading(true);
    // Scroll window smoothly to viewer top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const funLines = (texts.viewer.funLines as unknown as string[]) || [
    'warming up the paper 🥵',
    'bribing the pdf gods 🙏',
    'almost there, breathe 😮💨',
    'this one had 100 written all over it 📝',
  ];
  const currentLine = funLines[lineIndex % funLines.length] || funLines[0];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF5FF] dark:bg-[#0F0618] animate-fade-in transition-colors pb-20">
      {/* CENTUM In-App Viewer Toolbar Header */}
      <div className="sticky top-0 z-30 p-3 sm:p-4 bg-white/95 dark:bg-[#1B0B2E]/95 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/pro');
              }
            }}
            aria-label="Back"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#3B2063] transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EDE9FE] dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE]">
                Class {initialClass}th
              </span>
              {activeSubject && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EDE9FE] dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE]">
                  {activeSubject}
                </span>
              )}
              {activeYear && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {activeYear}
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] truncate leading-tight mt-0.5 max-w-[240px] sm:max-w-md">
              {activeTitle}
            </h1>
          </div>
        </div>

        {/* Secondary Ghost Download Action */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={hasError}
          aria-label="Download file"
          className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED] text-[#7C3AED] dark:text-[#DDD6FE] hover:bg-[#EDE9FE]/50 text-xs font-bold transition-all flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Download</span>
        </button>
      </div>

      {/* Main Full-Bleed Viewer Area */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 max-w-4xl mx-auto w-full">
        {hasError ? (
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
          <div className="flex-1 w-full min-h-[560px] sm:min-h-[680px] bg-white dark:bg-[#1B0B2E] rounded-2xl sm:rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] overflow-hidden shadow-sm relative flex flex-col">
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

            {/* Click Blocker to prevent external popouts */}
            <div
              className="absolute top-0 right-0 w-36 h-14 z-20 pointer-events-auto cursor-default bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              aria-hidden="true"
            />

            {/* Clipped iframe containing Drive embed preview */}
            <div className="w-full flex-1 min-h-[560px] sm:min-h-[680px] overflow-hidden relative">
              <iframe
                src={previewUrl}
                title={activeTitle}
                className="w-full h-[calc(100%+52px)] -mt-[52px] border-0 min-h-[612px]"
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

        {/* Siblings Under Viewer: "மேலும் தாள்கள் / பொருட்கள்" */}
        {siblingPapers.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
                <span>📚</span>
                <span>மேலும் தாள்கள் ({activeSubject})</span>
              </h2>
              <span className="text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635]">
                தட்டி உடனே காண்க
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {siblingPapers.map((paper: any) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => handleSwapDocument(paper)}
                  className="p-3 rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED] text-left transition-all shadow-xs flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#DDD6FE] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                        {paper.title}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {paper.exam} · {paper.year}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors shrink-0">
                    Open ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attribution & Privacy Footer */}
      <div className="px-4 py-3 border-t border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between text-[11px] text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-auto">
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-screen">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">loading viewer... ⚡</p>
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
