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

  useEffect(() => {
    setHasError(isPlaceholder);
  }, [paper, isPlaceholder]);

  if (!paper) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#3B0F6E] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E9D5FF] dark:border-[#DDD6FE]/20 text-[#2E1065] dark:text-[#FAF5FF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20 flex items-center justify-between bg-[#FAF5FF] dark:bg-[#230542]">
          <div className="flex items-center gap-2 pr-2 min-w-0">
            <div className="p-2 rounded-xl bg-[#F3E8FF] dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#A3E635] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                {paper.title}
              </h3>
              <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635]">
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
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#2E1065] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] text-[#6D28D9] dark:text-[#DDD6FE] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Drive Preview */}
        <div className="relative flex-1 bg-[#F4F4F5] dark:bg-[#230542] min-h-[360px] overflow-hidden flex flex-col">
          {hasError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {texts.papers.materialSoon}
              </p>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              title={paper.title}
              className="w-full h-full min-h-[360px] border-0"
              allow="autoplay"
              onError={() => setHasError(true)}
            />
          )}
        </div>

        {/* Attribution & Privacy */}
        <div className="p-3 bg-white dark:bg-[#3B0F6E] border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 flex items-center justify-between text-[11px] text-[#6D28D9]/75 dark:text-[#DDD6FE]/75">
          <span className="truncate">{texts.papers.attribution}</span>
          <Link
            href="/privacy"
            onClick={onClose}
            className="text-[#7C3AED] dark:text-[#A3E635] font-bold hover:underline shrink-0 ml-2"
          >
            privacy 🔒
          </Link>
        </div>
      </div>
    </div>
  );
};
