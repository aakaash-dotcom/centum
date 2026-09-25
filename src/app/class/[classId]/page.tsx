'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Paper, PaperCategory } from '@/types';
import { SkeletonCard } from '@/components/SkeletonCard';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Sparkles,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  normalizeSubject,
  getExamCanonicalKey,
  getExamFriendlyLabel,
} from '@/app/materials/page';

const CATEGORIES: { id: PaperCategory; label: string }[] = [
  { id: 'pyq', label: texts.categories.pyq },
  { id: 'model', label: texts.categories.model },
  { id: 'important', label: texts.categories.important },
  { id: 'book', label: texts.categories.book },
];

function ClassPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawClassId = (params?.classId as string) || '10th';
  const paramStandard = rawClassId.endsWith('th') ? rawClassId : `${rawClassId}th`;

  const {
    medium,
    student,
    isRegistered,
    openGate,
    plan,
    openPaywall,
    setGuestStandard,
  } = useApp();

  // If registered: their standard is fixed from profile/stream
  const effectiveStandard =
    isRegistered && student?.standard ? student.standard : paramStandard;

  // Lock guest standard when directly browsing a class link
  useEffect(() => {
    if (!isRegistered && (paramStandard === '10th' || paramStandard === '12th')) {
      setGuestStandard(paramStandard);
    }
  }, [isRegistered, paramStandard, setGuestStandard]);

  const initialCat = (searchParams.get('category') as PaperCategory) || 'pyq';
  const [selectedCategory, setSelectedCategory] = useState<PaperCategory>(initialCat);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [showBothMediums, setShowBothMediums] = useState<boolean>(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(40);

  const fetchPapers = () => {
    setIsLoading(true);
    setIsError(false);

    fetch(`/api/papers?classLevel=${encodeURIComponent(effectiveStandard)}`)
      .then(async (res) => {
        if (!res.ok) {
          setIsError(true);
          setPapers([]);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.papers)) {
          setPapers(data.papers);
        } else {
          setIsError(true);
          setPapers([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setPapers([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPapers();
  }, [effectiveStandard]);

  const standardPapers = useMemo(() => {
    return papers.filter((p) => {
      const c = String(p.classLevel || '').trim().toLowerCase();
      const target = effectiveStandard.toLowerCase();
      return c === target || (target === '10th' && c === '10') || (target === '12th' && c === '12');
    });
  }, [papers, effectiveStandard]);

  // Subject options
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    standardPapers.forEach((p) => {
      const norm = normalizeSubject(p.subject);
      if (norm) set.add(norm);
    });

    if (set.size === 0) {
      return effectiveStandard === '12th'
        ? ['All', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
        : ['All', 'Tamil', 'English', 'Maths', 'Science', 'Social Science'];
    }

    const priority = [
      'Tamil',
      'English',
      'Maths',
      'Science',
      'Social Science',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Commerce',
      'Accountancy',
      'Economics',
    ];

    const sortedList = Array.from(set).sort((a, b) => {
      const iA = priority.indexOf(a);
      const iB = priority.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['All', ...sortedList];
  }, [standardPapers, effectiveStandard]);

  // Exam type options
  const availableExams = useMemo(() => {
    const relevantPapers = standardPapers.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      return cat === 'pyq' || cat === 'model';
    });
    const keysSet = new Set<string>();
    relevantPapers.forEach((p) => {
      const key = getExamCanonicalKey(p.exam);
      if (key) keysSet.add(key);
    });

    const priority = ['annual', 'quarterly', 'halfyearly', 'revision', 'model'];
    const sortedKeys = Array.from(keysSet).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['all', ...sortedKeys];
  }, [standardPapers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return standardPapers.filter((p) => {
      const matchCategory = String(p.category || '').toLowerCase() === String(selectedCategory || '').toLowerCase();
      const matchMedium = showBothMediums
        ? true
        : String(p.medium || '').toLowerCase() === String(medium || '').toLowerCase();
      const matchSubject =
        selectedSubject === 'All' ||
        normalizeSubject(p.subject).toLowerCase() === selectedSubject.toLowerCase();

      let matchExam = true;
      if (
        (selectedCategory === 'pyq' || selectedCategory === 'model') &&
        selectedExam !== 'all'
      ) {
        matchExam = getExamCanonicalKey(p.exam) === selectedExam;
      }

      return matchCategory && matchMedium && matchSubject && matchExam;
    });
  }, [
    standardPapers,
    selectedCategory,
    showBothMediums,
    medium,
    selectedSubject,
    selectedExam,
  ]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(40);
  }, [
    selectedCategory,
    selectedSubject,
    selectedExam,
    showBothMediums,
    medium,
    effectiveStandard,
  ]);

  const visiblePapers = filteredPapers.slice(0, visibleCount);
  const hasMorePapers = filteredPapers.length > visibleCount;

  const isUserPro = String(plan || '').toLowerCase() === 'pro' || String(plan || '').toLowerCase() === 'live';
  const isPyqOrModel = String(selectedCategory || '').toLowerCase() === 'pyq' || String(selectedCategory || '').toLowerCase() === 'model';

  const handleOpenPaper = (paper: Paper, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const navigateToViewer = () => {
      const query = new URLSearchParams({
        id: paper.id,
        fileId: paper.driveFileId,
        title: paper.title,
        subject: normalizeSubject(paper.subject),
        year: paper.year,
      });
      router.push(`/viewer?${query.toString()}`);
    };

    if (String(paper.plan || '').toLowerCase() === 'pro') {
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
              {String(medium || '').toLowerCase() === 'english' ? 'English' : 'தமிழ்'} medium
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
                setSelectedExam('all');
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

      {/* TWO compact native-style dropdowns (purple styling, 44px, chevron icon) */}
      <div className={isPyqOrModel ? 'grid grid-cols-2 gap-2.5 mb-3' : 'mb-3'}>
        {/* Dropdown 1: [ subject ▾ ] */}
        <div className="relative">
          <label htmlFor="class-subject-select" className="sr-only">
            Subject
          </label>
          <select
            id="class-subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full min-h-[44px] appearance-none bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:outline-none rounded-2xl px-3.5 pr-8 text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] shadow-xs cursor-pointer transition-all"
          >
            {availableSubjects.map((subj) => (
              <option
                key={subj}
                value={subj}
                className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-bold"
              >
                {subj === 'All' ? texts.papers.allSubjects : subj}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
        </div>

        {/* Dropdown 2: [ exam type ▾ ] (Applies to PYQ + Model Question Papers) */}
        {isPyqOrModel && (
          <div className="relative">
            <label htmlFor="class-exam-select" className="sr-only">
              Exam Type
            </label>
            <select
              id="class-exam-select"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full min-h-[44px] appearance-none bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:outline-none rounded-2xl px-3.5 pr-8 text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] shadow-xs cursor-pointer transition-all"
            >
              {availableExams.map((ex) => (
                <option
                  key={ex}
                  value={ex}
                  className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-bold"
                >
                  {getExamFriendlyLabel(ex)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Count Line ("12 papers 📄") + Minimal "Both Mediums" Switch */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-black text-[#6D28D9] dark:text-[#A3E635]">
          {filteredPapers.length} {texts.papers.papersCount}
        </span>

        <button
          type="button"
          onClick={() => setShowBothMediums(!showBothMediums)}
          className={`min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
            showBothMediums
              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
              : 'bg-white dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40'
          }`}
          title="Toggle both mediums"
        >
          <span>{texts.papers.bothMediums}</span>
        </button>
      </div>

      {/* Item List (Windowed / Virtualized to 40 max initially) */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <SkeletonCard count={3} />
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">👻</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mb-3">
              {texts.states.signalGhost}
            </p>
            <button
              type="button"
              onClick={fetchPapers}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer"
            >
              retry 🔄
            </button>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-2">🐶</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75">
              {texts.states.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePapers.map((paper) => {
              const isLockedForUser = String(paper.plan || '').toLowerCase() === 'pro' && !isUserPro && isRegistered;

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
                            {normalizeSubject(paper.subject)}
                          </span>
                          {paper.medium && (
                            <span className="text-[10px] font-semibold text-[#6D28D9]/50 dark:text-[#DDD6FE]/50">
                              · {String(paper.medium).toLowerCase() === 'english' ? 'English' : 'தமிழ்'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {String(paper.plan || '').toLowerCase() === 'pro' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black flex items-center gap-1 shrink-0 border border-amber-300 shadow-2xs">
                        <Lock className="w-2.5 h-2.5 text-amber-950" />
                        <span>Pro</span>
                      </span>
                    )}
                  </div>

                  {/* Single Tap Target "Open →" */}
                  <div className="flex items-center justify-end pt-2 border-t border-[#FAF5FF] dark:border-[#3B2063]">
                    {isLockedForUser ? (
                      <button
                        type="button"
                        onClick={(e) => handleOpenPaper(paper, e)}
                        className="min-h-[44px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-yellow-400/25 to-amber-500/20 dark:from-amber-500/25 dark:via-yellow-500/20 dark:to-amber-400/30 text-amber-950 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-400/80 hover:bg-amber-400/30 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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

            {/* Pagination / Windowing Button for >40 rows */}
            {hasMorePapers && (
              <div className="pt-2 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 40)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] text-xs font-black text-[#7C3AED] dark:text-[#A3E635] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>show more papers ⬇</span>
                  <span className="text-[10px] opacity-75">
                    ({filteredPapers.length - visibleCount} more)
                  </span>
                </button>
              </div>
            )}
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
