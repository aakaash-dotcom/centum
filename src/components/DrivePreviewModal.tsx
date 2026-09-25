'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Paper } from '@/types';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { X, Download, FileText } from 'lucide-react';

interface DrivePreviewModalProps {
  paper: Paper | null;
  onClose: () => void;
}

function extractDriveFileId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

export const DrivePreviewModal: React.FC<DrivePreviewModalProps> = ({ paper, onClose }) => {
  const { isRegistered, openGate, showToast } = useApp();

  const rawFileId = paper?.driveFileId || '';
  const driveFileId = extractDriveFileId(rawFileId);

  const isPlaceholder =
    !driveFileId ||
    driveFileId.trim() === '' ||
    driveFileId.toUpperCase().includes('REPLACE') ||
    driveFileId.toUpperCase().includes('PLACEHOLDER');

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(isPlaceholder);
    setIsLoading(!isPlaceholder);
  }, [paper, isPlaceholder]);

  if (!paper) return null;

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
        link.download = `${paper.title || 'centum-paper'}.pdf`;
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1B0B2E] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E9D5FF] dark:border-[#3B2063] text-[#2E1065] dark:text-[#F5F0FF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between bg-[#FAF5FF] dark:bg-[#0F0618]">
          <div className="flex items-center gap-2 pr-2 min-w-0">
            <div className="p-2 rounded-xl bg-[#F3E8FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-extrabold text-[#2E1065] dark:text-[#F5F0FF] truncate">
                {paper.title}
              </h3>
              <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                {paper.subject} · {paper.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Header download button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={hasError}
              aria-label="Download"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#18181B] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#2A1247] hover:bg-[#F3E8FF] dark:hover:bg-[#3B2063] text-[#6D28D9] dark:text-[#B9A6D9] border border-[#DDD6FE] dark:border-[#3B2063] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Drive Preview */}
        <div className="relative flex-1 bg-[#F4F4F5] dark:bg-[#0F0618] min-h-[380px] overflow-hidden flex flex-col">
          {isLoading && !hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-[#1B0B2E] p-6 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-3" />
              <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">opening paper... ⚡</p>
            </div>
          )}

          {hasError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.papers.materialSoon}
              </p>
            </div>
          ) : (
            <div className="w-full h-full min-h-[380px] overflow-hidden relative">
              {/* Drive Popout Blocker */}
              <div
                className="absolute top-0 right-0 w-32 h-14 z-10 pointer-events-auto cursor-default bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
              <iframe
                src={previewUrl}
                title={paper.title}
                className="w-full h-[calc(100%+52px)] -mt-[52px] min-h-[432px] border-0"
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

        {/* Attribution & Privacy */}
        <div className="p-3 bg-white dark:bg-[#1B0B2E] border-t border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-between text-[11px] text-[#6D28D9]/75 dark:text-[#B9A6D9]">
          <span className="truncate">{texts.papers.attribution}</span>
          <Link
            href="/privacy"
            onClick={onClose}
            className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline shrink-0 ml-2"
          >
            privacy 🔒
          </Link>
        </div>
      </div>
    </div>
  );
};
