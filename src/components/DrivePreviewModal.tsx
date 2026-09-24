'use client';

import React from 'react';
import Link from 'next/link';
import { Paper } from '@/types';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface DrivePreviewModalProps {
  paper: Paper | null;
  onClose: () => void;
}

export const DrivePreviewModal: React.FC<DrivePreviewModalProps> = ({ paper, onClose }) => {
  const { isRegistered, openGate, showToast } = useApp();

  if (!paper) return null;

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${paper.driveFileId}`;
  const previewUrl = `https://drive.google.com/file/d/${paper.driveFileId}/preview`;

  const handleDownload = () => {
    if (!isRegistered) {
      // Guest: open gate with action to trigger download once registered
      openGate(() => {
        window.open(downloadUrl, '_blank');
        showToast(texts.papers.yeThePaper);
      });
      return;
    }

    // Registered: download directly
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E9D5FF] text-[#2E1065]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF5FF]">
          <div className="flex items-center gap-2 pr-2 min-w-0">
            <div className="p-2 rounded-xl bg-[#F3E8FF] text-[#7C3AED] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-extrabold text-[#2E1065] truncate">
                {paper.title}
              </h3>
              <p className="text-xs font-bold text-[#7C3AED]">
                {paper.subject} · {paper.year}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-[#F3E8FF] text-[#6D28D9] border border-[#DDD6FE] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded Drive Preview */}
        <div className="relative flex-1 bg-[#F4F4F5] min-h-[360px] overflow-hidden">
          <iframe
            src={previewUrl}
            title={paper.title}
            className="w-full h-full min-h-[360px] border-0"
            allow="autoplay"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#EDE9FE] space-y-2">
          {/* Big Lime Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{texts.papers.download}</span>
          </button>

          {/* Attribution & Privacy */}
          <div className="flex items-center justify-between text-[11px] text-[#6D28D9]/75 pt-1 px-1">
            <span className="truncate">{texts.papers.attribution}</span>
            <Link
              href="/privacy"
              onClick={onClose}
              className="text-[#7C3AED] font-bold hover:underline shrink-0 ml-2"
            >
              privacy 🔒
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
