'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Download, FileText } from 'lucide-react';

interface Props {
  currentFileId: string;
  currentTitle: string;
  subject: string;
  classLevel: string;
  medium: string;
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

export default function ViewerInteractiveDrawer({
  currentFileId,
  currentTitle,
  subject,
  classLevel,
  medium,
}: Props) {
  const router = useRouter();
  const { isRegistered, openGate, showToast } = useApp();
  const [siblingPapers, setSiblingPapers] = useState<any[]>([]);

  const cleanCurrentId = extractDriveFileId(currentFileId);

  useEffect(() => {
    async function fetchSiblings() {
      try {
        const res = await fetch(
          `/api/papers?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}&medium=${encodeURIComponent(medium)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.papers)) {
            const others = data.papers
              .filter((p: any) => {
                const pId = extractDriveFileId(p.pdfUrl || p.driveFileId || p.id || '');
                return pId !== cleanCurrentId;
              })
              .slice(0, 8);
            setSiblingPapers(others);
          }
        }
      } catch (err) {
        console.warn('Failed to load sibling papers', err);
      }
    }
    fetchSiblings();
  }, [subject, classLevel, medium, cleanCurrentId]);

  const handleDownload = () => {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${cleanCurrentId}`;
    const triggerDownload = () => {
      try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${currentTitle || 'centum-document'}.pdf`;
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

  const handleSwap = (p: any) => {
    const nextId = extractDriveFileId(p.pdfUrl || p.driveFileId || p.id || '');
    const nextTitle = p.title || 'Question Paper';
    const nextSubject = p.subject || subject;
    const nextYear = p.year ? String(p.year) : '';
    router.push(
      `/viewer?page=papers&id=${encodeURIComponent(nextId)}&title=${encodeURIComponent(nextTitle)}&subject=${encodeURIComponent(nextSubject)}&year=${encodeURIComponent(nextYear)}&classLevel=${encodeURIComponent(classLevel)}&medium=${encodeURIComponent(medium)}`
    );
  };

  return (
    <div className="w-full">
      {/* Download Action Bar */}
      <div className="flex justify-end p-2">
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download paper"
          className="px-3 py-1.5 rounded-xl border border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED] text-[#7C3AED] dark:text-[#DDD6FE] hover:bg-[#EDE9FE]/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Sibling Papers Section */}
      {siblingPapers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#EDE9FE] dark:border-[#3B2063]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] flex items-center gap-1.5">
              <span>📚</span>
              <span>மேலும் தாள்கள் ({subject})</span>
            </h3>
            <span className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA]">
              தட்டி உடனே காண்க
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {siblingPapers.map((p, idx) => (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => handleSwap(p)}
                className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED] dark:hover:border-[#A78BFA] transition-all flex items-center justify-between gap-2 shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA] shrink-0 group-hover:scale-110 transition-transform">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate">
                      {p.title || `${p.subject} Exam Paper`}
                    </p>
                    <p className="text-[10px] font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                      {p.exam || 'Exam'} {p.year ? `· ${p.year}` : ''}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#DDD6FE] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                  Open ↗
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
