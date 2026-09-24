'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Paper, PaperCategory } from '@/types';
import { SAMPLE_PAPERS } from '@/data/sampleData';
import { DrivePreviewModal } from '@/components/DrivePreviewModal';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FileText, Download, Eye, Sparkles, Lock } from 'lucide-react';

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

function MaterialsContent() {
  const searchParams = useSearchParams();
  const { medium, student, isRegistered, openGate, plan, openPaywall, showToast } = useApp();

  // Preselect registered student's standard, default 10th
  const defaultStandard = student?.standard === '12th' ? '12th' : '10th';
  const [selectedStandard, setSelectedStandard] = useState<string>(defaultStandard);

  const initialCat = (searchParams.get('category') as PaperCategory) || 'pyq';
  const [selectedCategory, setSelectedCategory] = useState<PaperCategory>(initialCat);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePaper, setActivePaper] = useState<Paper | null>(null);

  // Sync if student changes
  useEffect(() => {
    if (student?.standard === '12th' || student?.standard === '10th') {
      setSelectedStandard(student.standard);
    }
  }, [student]);

  // Fetch papers from API or sample bundle
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/papers?classLevel=${encodeURIComponent(selectedStandard)}&medium=${medium}`)
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
  }, [selectedStandard, medium]);

  const subjectList = selectedStandard === '12th' ? SUBJECTS_12TH : SUBJECTS_10TH;

  // Filter papers
  const filteredPapers = papers.filter((p) => {
    const matchClass = p.classLevel.toLowerCase() === selectedStandard.toLowerCase();
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

    // Check if Pro item
    if (paper.plan === 'pro') {
      if (!isRegistered) {
        // Guests behave exactly as today
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
        // Free user tapping Pro item -> open Paywall sheet, NOT preview/download
        openPaywall();
        return;
      }
    } else {
      // Free item
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

    // Unlocked action
    if (action === 'download') {
      window.open(`https://drive.google.com/uc?export=download&id=${paper.driveFileId}`, '_blank');
      showToast(texts.papers.yeThePaper);
    } else {
      setActivePaper(paper);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in">
      {/* Top Header & Standard Selector Chips [10th] [12th] */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-[#2E1065] tracking-tight">
            {texts.nav.materials} 📚
          </h1>
          <p className="text-[11px] font-bold text-[#7C3AED]">
            official papers & books
          </p>
        </div>

        {/* Chips [10th] and [12th] */}
        <div className="inline-flex p-1 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs">
          {['10th', '12th'].map((cls) => {
            const isSelected = selectedStandard === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  setSelectedStandard(cls);
                  setSelectedSubject('All');
                }}
                className={`min-h-[38px] px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#6D28D9] hover:bg-[#FAF5FF]'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
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
              className={`min-h-[58px] p-3 rounded-2xl text-left font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center justify-between border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-[#7C3AED]/20 border-[#7C3AED] scale-[1.01]'
                  : 'bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] text-[#2E1065] hover:border-[#7C3AED]/40 border-[#DDD6FE] shadow-xs'
              }`}
            >
              <span>{cat.label}</span>
              {isSelected && <Sparkles className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Horizontal Subject Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-1 px-1">
        {subjectList.map((subj) => {
          const isSelected = selectedSubject === subj;
          return (
            <button
              key={subj}
              type="button"
              onClick={() => setSelectedSubject(subj)}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
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

      {/* Papers List */}
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
            {filteredPapers.map((paper) => {
              const isLockedForUser = paper.plan === 'pro' && !isUserPro && isRegistered;

              return (
                <div
                  key={paper.id}
                  onClick={() => handlePaperAccess(paper, 'view')}
                  className="w-full bg-white rounded-2xl p-4 border border-[#EDE9FE] hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative"
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
                          <span className="text-[10px] font-extrabold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-md">
                            {paper.year}
                          </span>
                          <span className="text-[10px] font-bold text-[#6D28D9]/60">
                            {paper.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pro 🔒 Chip for locked rows */}
                    {paper.plan === 'pro' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] border border-[#DDD6FE] text-[#7C3AED] text-[10px] font-black flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Pro</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#FAF5FF]">
                    {isLockedForUser ? (
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
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Drive Preview Modal */}
      <DrivePreviewModal
        paper={activePaper}
        onClose={() => setActivePaper(null)}
      />
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading materials... ⚡</p>
        </div>
      }
    >
      <MaterialsContent />
    </Suspense>
  );
}
