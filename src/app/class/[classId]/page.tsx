'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Paper, PaperCategory } from '@/types';
import { SAMPLE_PAPERS } from '@/data/sampleData';
import { DrivePreviewModal } from '@/components/DrivePreviewModal';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ArrowLeft, FileText, Download, Eye, Sparkles, Lock } from 'lucide-react';

const CATEGORIES: { id: PaperCategory; label: string }[] = [
  { id: 'pyq', label: texts.categories.pyq },
  { id: 'model', label: texts.categories.model },
  { id: 'important', label: texts.categories.important },
  { id: 'book', label: texts.categories.book },
];

const SUBJECTS_10TH = ['All', 'Tamil', 'English', 'Maths', 'Science', 'Social Science'];
const SUBJECTS_12TH = [
  'All',
  'Maths',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Commerce',
  'Accountancy',
  'Economics',
];

function ClassPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawClassId = (params?.classId as string) || '10th';
  const classId = rawClassId.endsWith('th') ? rawClassId : `${rawClassId}th`;

  const { medium, toggleMedium, isRegistered, openGate, showToast, plan, openPaywall } = useApp();

  const initialCat = (searchParams.get('category') as PaperCategory) || 'pyq';
  const [selectedCategory, setSelectedCategory] = useState<PaperCategory>(initialCat);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePaper, setActivePaper] = useState<Paper | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/papers?classLevel=${encodeURIComponent(classId)}&medium=${medium}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.papers && Array.isArray(data.papers)) {
            setPapers(data.papers);
          } else {
            setPapers(SAMPLE_PAPERS);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPapers(SAMPLE_PAPERS);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [classId, medium]);

  const subjectList = classId === '12th' ? SUBJECTS_12TH : SUBJECTS_10TH;

  const filteredPapers = papers.filter((p) => {
    const matchClass = p.classLevel.toLowerCase() === classId.toLowerCase();
    const matchMedium = p.medium === medium;
    const matchCategory = p.category === selectedCategory;
    const matchSubject =
      selectedSubject === 'All' ||
      p.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchClass && matchMedium && matchCategory && matchSubject;
  });

  const isUserPro = plan === 'pro' || plan === 'live';

  const handlePaperAccess = (paper: Paper, action: 'view' | 'download', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (paper.plan === 'pro') {
      if (!isRegistered) {
        openGate(() => {
          if (action === 'download') {
            window.open(`https://drive.google.com/uc?export=download&id=${paper.driveFileId}`, '_blank');
          } else {
            setActivePaper(paper);
          }
        });
        return;
      }

      if (!isUserPro) {
        openPaywall();
        return;
      }
    } else {
      if (!isRegistered) {
        openGate(() => {
          if (action === 'download') {
            window.open(`https://drive.google.com/uc?export=download&id=${paper.driveFileId}`, '_blank');
          } else {
            setActivePaper(paper);
          }
        });
        return;
      }
    }

    if (action === 'download') {
      window.open(`https://drive.google.com/uc?export=download&id=${paper.driveFileId}`, '_blank');
      showToast(texts.papers.yeThePaper);
    } else {
      setActivePaper(paper);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#EDE9FE] text-[#7C3AED] hover:bg-[#F3E8FF] transition-all cursor-pointer shadow-xs"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <h1 className="text-2xl font-black text-[#2E1065] tracking-tight">
            {classId}
          </h1>
        </div>

        {/* Tappable Medium Pill to Switch */}
        <button
          type="button"
          onClick={toggleMedium}
          className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-white border border-[#DDD6FE] text-xs font-black text-[#7C3AED] shadow-xs hover:bg-[#F3E8FF] transition-all cursor-pointer flex items-center gap-1.5"
          aria-label="Switch medium"
        >
          <span className="opacity-70">Medium:</span>
          <span className="underline decoration-2 decoration-[#A3E635]">
            {medium === 'english' ? 'English' : 'தமிழ்'}
          </span>
          <span>🔄</span>
        </button>
      </div>

      {/* 4 Category Boxes (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubject('All');
              }}
              className={`min-h-[64px] p-3 rounded-2xl text-left font-bold text-sm tracking-tight transition-all cursor-pointer flex items-center justify-between border ${
                isSelected
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 border-[#7C3AED] scale-[1.02]'
                  : 'bg-white text-[#2E1065] hover:bg-[#FAF5FF] border-[#EDE9FE] shadow-xs'
              }`}
            >
              <span>{cat.label}</span>
              {isSelected && <Sparkles className="w-4 h-4 text-[#A3E635] shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Horizontal Subject Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-1 px-1">
        {subjectList.map((subj) => {
          const isSelected = selectedSubject === subj;
          return (
            <button
              key={subj}
              type="button"
              onClick={() => setSelectedSubject(subj)}
              className={`min-h-[44px] px-4 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#2E1065] text-white border-[#2E1065] shadow-xs'
                  : 'bg-white text-[#6D28D9] border-[#EDE9FE] hover:bg-[#F3E8FF]'
              }`}
            >
              {subj}
            </button>
          );
        })}
      </div>

      {/* Item List */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <SkeletonCard count={3} />
        ) : filteredPapers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-2">🐶</span>
            <p className="text-sm font-bold text-[#6D28D9]/75">
              {texts.states.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => setActivePaper(paper)}
                className="w-full bg-white rounded-2xl p-4 border border-[#EDE9FE] hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-[#FAF5FF] text-[#7C3AED] group-hover:bg-[#F3E8FF] transition-colors shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#2E1065] leading-snug line-clamp-2">
                        {paper.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-extrabold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-md">
                          {paper.year}
                        </span>
                        <span className="text-[11px] font-bold text-[#6D28D9]/60">
                          {paper.subject}
                        </span>
                      </div>
                    </div>

                    {paper.plan === 'pro' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] border border-[#DDD6FE] text-[#7C3AED] text-[10px] font-black flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Pro</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#FAF5FF]">
                  {paper.plan === 'pro' && !isUserPro && isRegistered ? (
                    <button
                      type="button"
                      onClick={(e) => handlePaperAccess(paper, 'view', e)}
                      className="min-h-[40px] px-3.5 py-1 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] text-xs font-black text-[#7C3AED] border border-[#DDD6FE] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Unlock Pro 👑</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handlePaperAccess(paper, 'view', e)}
                        className="min-h-[40px] px-3.5 py-1 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] text-xs font-bold text-[#7C3AED] border border-[#EDE9FE] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{texts.papers.view}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handlePaperAccess(paper, 'download', e)}
                        className="min-h-[40px] px-3.5 py-1 rounded-xl bg-[#A3E635] hover:bg-[#92D928] text-xs font-black text-[#18181B] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{texts.papers.download}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Attribution Line */}
      <footer className="mt-8 pt-4 border-t border-[#EDE9FE] text-center">
        <p className="text-[11px] text-[#6D28D9]/70 font-semibold mb-1">
          {texts.papers.attribution}
        </p>
        <Link
          href="/privacy"
          className="text-[11px] text-[#7C3AED] font-extrabold hover:underline"
        >
          {texts.profile.privacyLink}
        </Link>
      </footer>

      {/* Embedded Drive Preview Modal */}
      <DrivePreviewModal
        paper={activePaper}
        onClose={() => setActivePaper(null)}
      />
    </div>
  );
}

export default function ClassPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading... ⚡</p>
        </div>
      }
    >
      <ClassPageContent />
    </Suspense>
  );
}
