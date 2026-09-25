'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TestType, Question } from '@/types';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';
import { SkeletonCard } from '@/components/SkeletonCard';
import {
  BookOpen,
  Brain,
  Lock,
  Sparkles,
  ChevronDown,
  X,
  Play,
  ArrowRight,
  Check,
} from 'lucide-react';
import { normalizeSubject } from '@/app/materials/page';

// Extract number from chapter name for sorting (Chapter 1 first, etc.)
const getChapterSortKey = (name: string): number => {
  const match = name.match(/^(?:chapter|unit|ch)?\s*(\d+)/i) || name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
};

interface ConfirmationModalState {
  chapterName: string;
  type: TestType;
  count: number;
  testKey: string;
}

function TestsContent() {
  const router = useRouter();
  const {
    medium,
    student,
    isRegistered,
    openGate,
    plan,
    openPaywall,
    guestStandard,
  } = useApp();

  // If registered: their standard is locked from profile (12th or 10th), no class chips
  // If guest: use guestStandard if chosen, otherwise default 10th
  const effectiveStandard = isRegistered
    ? student?.standard === '12th'
      ? '12th'
      : '10th'
    : guestStandard || '10th';

  const isUserPro = plan === 'pro' || plan === 'live';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tests page v2 state:
  // 1. Quiz Type selection ('oneword' | 'concept')
  const [selectedType, setSelectedType] = useState<TestType>('oneword');
  // 2. Select-subject expander state & selected subject
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  // 3. Slide-up confirmation modal state (nothing starts until tapped)
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState | null>(null);

  // Fetch questions from API or sample data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/questions?medium=${medium}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.questions && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          } else {
            setQuestions(SAMPLE_QUESTIONS);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQuestions(SAMPLE_QUESTIONS);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [medium]);

  // Questions matching current standard + medium
  const currentPool = useMemo(() => {
    return questions.filter(
      (q) =>
        q.classLevel.toLowerCase() === effectiveStandard.toLowerCase() &&
        q.medium === medium
    );
  }, [questions, effectiveStandard, medium]);

  // Subject options for dropdown (derived from data, or standard fallback)
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    currentPool.forEach((q) => {
      const norm = normalizeSubject(q.subject);
      if (norm) set.add(norm);
    });

    if (set.size === 0) {
      return effectiveStandard === '12th'
        ? ['Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
        : ['Maths', 'Science', 'Social Science', 'Tamil', 'English'];
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

    return Array.from(set).sort((a, b) => {
      const iA = priority.indexOf(a);
      const iB = priority.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [currentPool, effectiveStandard]);

  // Auto-select first subject if none selected or not in available list
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubject || !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    }
  }, [availableSubjects, selectedSubject]);

  // Chapters of selected subject sorted chapter-1 first
  const subjectChapters = useMemo(() => {
    if (!selectedSubject) return [];

    const map = new Map<
      string,
      {
        name: string;
        onewordCount: number;
        conceptCount: number;
      }
    >();

    currentPool
      .filter(
        (q) =>
          normalizeSubject(q.subject).toLowerCase() === selectedSubject.toLowerCase()
      )
      .forEach((q) => {
        const ch = q.chapter || 'General';
        if (!map.has(ch)) {
          map.set(ch, {
            name: ch,
            onewordCount: q.type === 'oneword' ? 1 : 0,
            conceptCount: q.type === 'concept' ? 1 : 0,
          });
        } else {
          const item = map.get(ch)!;
          if (q.type === 'oneword') item.onewordCount += 1;
          if (q.type === 'concept') item.conceptCount += 1;
        }
      });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const numA = getChapterSortKey(a.name);
      const numB = getChapterSortKey(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [currentPool, selectedSubject]);

  // Handle chapter row tap
  const handleChapterTap = (chapterName: string, index: number) => {
    const sortKey = getChapterSortKey(chapterName);
    const isChapter1 = index === 0 || sortKey === 1;

    // Concept quiz gating: chapter 1 is free sample, chapter 2+ locked for free students
    if (selectedType === 'concept' && !isChapter1 && !isUserPro) {
      openPaywall(
        texts.testTypes.conceptSampleNote ||
          'chapter 1 is free — the rest glows behind Pro ✨'
      );
      return;
    }

    const chObj = subjectChapters[index];
    const count =
      selectedType === 'concept'
        ? chObj?.conceptCount || 10
        : chObj?.onewordCount || 10;

    const testKey = `${effectiveStandard}_${selectedSubject}_${chapterName}_${selectedType}`;
    setConfirmModal({
      chapterName,
      type: selectedType,
      count: count > 0 ? count : 10,
      testKey,
    });
  };

  // Handle start test from confirmation sheet
  const handleConfirmStart = () => {
    if (!confirmModal) return;
    const testUrl = `/tests/${encodeURIComponent(confirmModal.testKey)}`;
    const destinationKey = confirmModal.testKey;

    setConfirmModal(null);

    if (!isRegistered) {
      openGate(() => {
        router.push(`/tests/${encodeURIComponent(destinationKey)}`);
      });
      return;
    }

    router.push(testUrl);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in relative">
      {/* Top Header (Registered: standard locked, no class chips) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {texts.nav.tests} 🧠
          </h1>
          <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635]">
            {effectiveStandard} standard · {medium === 'english' ? 'English' : 'தமிழ்'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : (
        <div className="space-y-3">
          {/* 1. Quiz type — 2 equal boxes in ONE ROW (grid-cols-2) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Box 1: [📖 book-back one-words] */}
            <button
              type="button"
              onClick={() => setSelectedType('oneword')}
              className={`min-h-[56px] p-3 rounded-2xl text-left font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                selectedType === 'oneword'
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">book-back one-words</span>
            </button>

            {/* Box 2: [🧠 concept quiz] */}
            <button
              type="button"
              onClick={() => setSelectedType('concept')}
              className={`min-h-[56px] p-3 rounded-2xl text-left font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                selectedType === 'concept'
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
              }`}
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span className="truncate">concept quiz</span>
            </button>
          </div>

          {/* 2. Second row — ONE full-width thin box: [⚡ pro quiz — AI powered 🔒] tap → PaywallSheet */}
          <button
            type="button"
            onClick={() =>
              openPaywall(
                texts.testTypes.proPitch ||
                  'daily speed battles · timed rank · full leaderboard ⚡'
              )
            }
            className="w-full min-h-[44px] px-4 py-2 rounded-2xl transition-all cursor-pointer flex items-center justify-between border bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF] dark:from-[#3B0F6E] dark:to-[#2E1065] border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] text-[#2E1065] dark:text-[#FAF5FF] shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-black tracking-tight">
                pro quiz — AI powered
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] shadow-2xs">
                Pro
              </span>
              <Lock className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
            </div>
          </button>

          {/* 3. Select-subject box: single card reading "select subject ▾" expanding INSIDE that same card */}
          <div className="w-full bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] cursor-pointer hover:bg-[#FAF5FF] dark:hover:bg-[#230542] transition-colors"
            >
              <span>
                {selectedSubject ? `${selectedSubject} ▾` : 'select subject ▾'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#7C3AED] dark:text-[#A3E635] transition-transform duration-200 stroke-[2.5] ${
                  isSubjectDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isSubjectDropdownOpen && (
              <div className="p-2 pt-0 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/15 space-y-1 animate-fade-in">
                {availableSubjects.map((subj) => {
                  const isSelected = selectedSubject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(subj);
                        setIsSubjectDropdownOpen(false);
                      }}
                      className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white'
                          : 'text-[#2E1065] dark:text-[#FAF5FF] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
                      }`}
                    >
                      <span>{subj}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#A3E635] stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Chapters: after subject is chosen, show chapter rows ONLY: each row = 1 · {chapter name} */}
          <div className="pt-1">
            {subjectChapters.length === 0 ? (
              <div className="bg-white dark:bg-[#3B0F6E] rounded-2xl p-8 text-center border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                  no chapters uploaded yet for this subject 👨‍🍳
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subjectChapters.map((ch, index) => {
                  const sortKey = getChapterSortKey(ch.name);
                  const isChapter1 = index === 0 || sortKey === 1;

                  // Concept shows 🔒 on chapters 2+ for free users, one-words all free
                  const isLocked =
                    selectedType === 'concept' && !isChapter1 && !isUserPro;

                  // Format: 1 · {chapter name} (number + name), nothing else
                  const cleanName =
                    ch.name
                      .replace(/^(?:chapter|unit|ch)?\s*\d+\s*[:.-]?\s*/i, '')
                      .trim() || ch.name;
                  const displayRow = `${sortKey !== 999 ? sortKey : index + 1} · ${cleanName}`;

                  return (
                    <div
                      key={ch.name}
                      onClick={() => handleChapterTap(ch.name, index)}
                      className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-white dark:bg-[#3B0F6E] border border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-left group"
                    >
                      <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                        {displayRow}
                      </span>

                      {isLocked ? (
                        <span className="p-1.5 rounded-lg bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* START FLOW: Slide-up confirmation card */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Test Start"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#3B0F6E] rounded-t-3xl p-6 shadow-2xl border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 animate-slide-up flex flex-col gap-4 text-[#2E1065] dark:text-[#FAF5FF] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635]">
                  {texts.testTypes.readyToStart}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#230542] text-[#6D28D9] dark:text-[#A3E635] flex items-center justify-center hover:bg-[#EDE9FE] dark:hover:bg-[#4C1D95] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Details Card */}
            <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 space-y-2">
              <h3 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug">
                {confirmModal.chapterName}
              </h3>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-black text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#DDD6FE]/15 shadow-2xs">
                  {effectiveStandard} · {selectedSubject}
                </span>
                <span className="text-[11px] font-black text-[#2E1065] dark:text-[#FAF5FF] bg-white dark:bg-[#3B0F6E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#DDD6FE]/15 shadow-2xs">
                  {confirmModal.type === 'concept'
                    ? texts.testTypes.concept
                    : texts.testTypes.oneword}
                </span>
                <span className="text-[11px] font-black text-[#A3E635] bg-[#2E1065] px-2.5 py-1 rounded-lg shadow-2xs">
                  {confirmModal.count} questions
                </span>
              </div>
            </div>

            {/* "start →" Action Button */}
            <button
              type="button"
              onClick={handleConfirmStart}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              <span>{texts.testTypes.startConfirmCta}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B0F6E] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading tests... ⚡</p>
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}
