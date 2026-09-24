'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Paper, PaperCategory } from '@/types';
import { SAMPLE_PAPERS } from '@/data/sampleData';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ArrowLeft, ArrowRight, FileText, Sparkles, Lock } from 'lucide-react';

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
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawClassId = (params?.classId as string) || '10th';
  const paramStandard = rawClassId.endsWith('th') ? rawClassId : `${rawClassId}th`;

  const { medium, student, isRegistered, openGate, plan, openPaywall, setGuestStandard } = useApp();

  // If registered: their standard is fixed from profile/stream
  const effectiveStandard = isRegistered && student?.standard
    ? student.standard
    : paramStandard;

  // Lock guest standard when directly browsing a class link
  useEffect(() => {
    if (!isRegistered && (paramStandard === '10th' || paramStandard === '12th')) {
      setGuestStandard(paramStandard);
    }
  }, [isRegistered, paramStandard, setGuestStandard]);

  const initialCat = (searchParams.get('category') as PaperCategory) || 'pyq';
  const [selectedCategory, setSelectedCategory] = useState<PaperCategory>(initialCat);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/papers?classLevel=${encodeURIComponent(effectiveStandard)}&medium=${medium}`)
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
  }, [effectiveStandard, medium]);

  const subjectList = effectiveStandard === '12th' ? SUBJECTS_12TH : SUBJECTS_10TH;

  const filteredPapers = papers.filter((p) => {
    const matchClass = p.classLevel.toLowerCase() === effectiveStandard.toLowerCase();
    const matchMedium = p.medium === medium;
    const matchCategory = p.category === selectedCategory;
    const matchSubject =
      selectedSubject === 'All' ||
      p.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchClass && matchMedium && matchCategory && matchSubject;
  });

  const isUserPro = plan === 'pro' || plan === 'live';

  const handleOpenPaper = (paper: Paper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const navigateToViewer = () => {
      const query = new URLSearchParams({
        id: paper.id,
        fileId: paper.driveFileId,
        title: paper.title,
        subject: paper.subject,
        year: paper.year,
      });
      router.push(`/viewer?${query.toString()}`);
    };

    if (paper.plan === 'pro') {
      if (!isRegistered) {
        openGate(() => {
          navigateToViewer();
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
          navigateToViewer();
        });
        return;
      }
    }

    navigateToViewer();
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#3B0F6E] border border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] transition-all cursor-pointer shadow-xs"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
              {effectiveStandard}
            </h1>
            <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635]">
              {medium === 'english' ? 'English' : 'தமிழ்'} medium
            </p>
          </div>
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
              className={`min-h-[64px] p-3 rounded-2xl text-left font-bold text-sm tracking-tight transition-all cursor-pointer flex items-center justify-between border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-[#7C3AED]/20 border-[#7C3AED] scale-[1.02]'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] hover:border-[#7C3AED]/40 border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs'
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
                  ? 'bg-[#2E1065] text-white border-[#2E1065] dark:bg-[#FAF5FF] dark:text-[#230542] dark:border-white shadow-xs'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95]'
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
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75">
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
                  onClick={(e) => handleOpenPaper(paper, e)}
                  className="w-full bg-white dark:bg-[#3B0F6E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] group-hover:bg-[#F3E8FF] dark:group-hover:bg-[#4C1D95] transition-colors shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2">
                          {paper.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A3E635] bg-[#F3E8FF] dark:bg-[#230542] px-2 py-0.5 rounded-md">
                            {paper.year}
                          </span>
                          <span className="text-[11px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                            {paper.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    {paper.plan === 'pro' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] text-[10px] font-black flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Pro</span>
                      </span>
                    )}
                  </div>

                  {/* Single Tap Target "Open →" (requirement 4) */}
                  <div className="flex items-center justify-end pt-2 border-t border-[#FAF5FF] dark:border-[#230542]">
                    {isLockedForUser ? (
                      <button
                        type="button"
                        onClick={(e) => handleOpenPaper(paper, e)}
                        className="min-h-[44px] px-4 py-1.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] text-xs font-black text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
                        <span>Unlock Pro 👑</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleOpenPaper(paper, e)}
                        className="min-h-[44px] px-4 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.02]"
                      >
                        <span>{texts.papers.open}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Attribution Line */}
      <footer className="mt-8 pt-4 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-center">
        <p className="text-[11px] text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 font-semibold mb-1">
          {texts.papers.attribution}
        </p>
        <Link
          href="/privacy"
          className="text-[11px] text-[#7C3AED] dark:text-[#A3E635] font-extrabold hover:underline"
        >
          {texts.profile.privacyLink}
        </Link>
      </footer>
    </div>
  );
}

export default function ClassPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B0F6E] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading... ⚡</p>
        </div>
      }
    >
      <ClassPageContent />
    </Suspense>
  );
}
