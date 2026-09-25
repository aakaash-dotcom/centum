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
  Crown,
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
    setGuestStandard,
  } = useApp();

  // If registered: standard is fixed from profile (12th or 10th)
  // If guest: use guestStandard if chosen, otherwise default 10th
  const effectiveStandard = isRegistered
    ? student?.standard === '12th'
      ? '12th'
      : '10th'
    : guestStandard || '10th';

  const isUserPro = plan === 'pro' || plan === 'live';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New layout order:
  // 1. Quiz Type selection ('oneword' | 'concept' | 'pro')
  const [selectedType, setSelectedType] = useState<TestType | 'pro'>('oneword');
  // 2. Subject dropdown selection
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

  // Handle tap on top Pro Quiz card
  const handleTapProCard = () => {
    if (!isUserPro) {
      openPaywall(
        texts.testTypes.proPitch ||
          'daily speed battles · timed rank · full leaderboard ⚡'
      );
      return;
    }
    setSelectedType('pro');
  };

  // Handle initiating test confirmation flow
  const handleInitiateQuiz = (
    chapterName: string,
    chapterIndex: number,
    typeToUse: TestType,
    count: number
  ) => {
    // 1. Concept Quiz Gating:
    // Only chapter 1 (index 0 or sortKey === 1) is free sample of Pro.
    // Chapters 2+ show lock and open PaywallSheet for free users.
    const sortKey = getChapterSortKey(chapterName);
    const isChapter1 = chapterIndex === 0 || sortKey === 1;

    if (typeToUse === 'concept' && !isChapter1 && !isUserPro) {
      openPaywall(
        texts.testTypes.conceptSampleNote ||
          'chapter 1 is free — the rest glows behind Pro ✨'
      );
      return;
    }

    // 2. Open slide-up confirmation card (No auto-start)
    const effectiveCount = count > 0 ? count : 10;
    const testKey = `${effectiveStandard}_${selectedSubject}_${chapterName}_${typeToUse}`;
    setConfirmModal({
      chapterName,
      type: typeToUse,
      count: effectiveCount,
      testKey,
    });
  };

  // Handle final start from confirmation card
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
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {texts.nav.tests} 🧠
          </h1>
          <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635]">
            {effectiveStandard} standard · {medium === 'english' ? 'English' : 'தமிழ்'}
          </p>
        </div>

        {/* Guest one-time standard pick: ONLY visible for guests who haven't locked yet */}
        {!isRegistered && !guestStandard && (
          <div className="inline-flex p-1 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
            {['10th', '12th'].map((cls) => {
              const isSelected = effectiveStandard === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setGuestStandard(cls);
                    setSelectedSubject('');
                  }}
                  className={`min-h-[38px] px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : (
        <div className="space-y-4">
          {/* 1. TOP-TO-BOTTOM ORDER: Vertical stack of 3 full-width min-h-[72px] cards */}
          <div className="space-y-2.5">
            {/* Card 1: Book-back one-words (Fully free) */}
            <div
              onClick={() => setSelectedType('oneword')}
              className={`w-full min-h-[72px] p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                selectedType === 'oneword'
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedType === 'oneword'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]'
                  }`}
                >
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {texts.testTypes.oneword}
                  </h3>
                  <p
                    className={`text-[11px] font-bold mt-0.5 ${
                      selectedType === 'oneword'
                        ? 'text-[#A3E635]'
                        : 'text-[#6D28D9]/70 dark:text-[#DDD6FE]/70'
                    }`}
                  >
                    all chapters free ✨
                  </p>
                </div>
              </div>

              {selectedType === 'oneword' && (
                <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                </div>
              )}
            </div>

            {/* Card 2: Concept Quiz (Chapter 1 free sample, Chapters 2+ Pro) */}
            <div
              onClick={() => setSelectedType('concept')}
              className={`w-full min-h-[72px] p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                selectedType === 'concept'
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                  : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedType === 'concept'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]'
                  }`}
                >
                  <Brain className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {texts.testTypes.concept}
                  </h3>
                  <p
                    className={`text-[11px] font-bold mt-0.5 ${
                      selectedType === 'concept'
                        ? 'text-[#A3E635]'
                        : 'text-[#7C3AED] dark:text-[#A3E635]'
                    }`}
                  >
                    {texts.testTypes.ch1FreeSample}
                  </p>
                </div>
              </div>

              {selectedType === 'concept' && (
                <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                </div>
              )}
            </div>

            {/* Card 3: Pro Quiz 🔒 (Locked entry → PaywallSheet with daily-battle pitch) */}
            <div
              onClick={handleTapProCard}
              className="w-full min-h-[72px] p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between border bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF] dark:from-[#3B0F6E] dark:to-[#2E1065] border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] text-[#2E1065] dark:text-[#FAF5FF] shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight">
                      {texts.testTypes.proQuiz}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] shadow-xs">
                      Pro 👑
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 mt-0.5">
                    daily speed battles · timed rank ⚡
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-white/60 dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* 2. BELOW: [ subject ▾ ] dropdown (their standard's subjects) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] tracking-wider">
                Select Subject 📚
              </span>
              <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                {availableSubjects.length} subjects
              </span>
            </div>

            <div className="relative">
              <label htmlFor="tests-subject-select" className="sr-only">
                Subject
              </label>
              <select
                id="tests-subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full min-h-[44px] appearance-none bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:outline-none rounded-2xl px-4 pr-10 text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] shadow-xs cursor-pointer transition-all"
              >
                {availableSubjects.map((subj) => (
                  <option
                    key={subj}
                    value={subj}
                    className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-bold"
                  >
                    {subj}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            </div>
          </div>

          {/* 3. BELOW: Chapters of that subject sorted chapter-1 first as cards */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] tracking-wider">
                Chapters 📖
              </span>
              <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                {subjectChapters.length} chapters
              </span>
            </div>

            {subjectChapters.length === 0 ? (
              <div className="bg-white dark:bg-[#3B0F6E] rounded-2xl p-8 text-center border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                  no chapters uploaded yet for this subject 👨‍🍳
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjectChapters.map((ch, index) => {
                  const sortKey = getChapterSortKey(ch.name);
                  const isChapter1 = index === 0 || sortKey === 1;

                  // Active question count based on selectedType
                  const activeCount =
                    selectedType === 'concept' ? ch.conceptCount : ch.onewordCount;

                  // Concept Quiz Gating: within each subject, ONLY the chapter-1 concept quiz is free
                  // Chapters 2+ show lock for free users
                  const isConceptLocked =
                    selectedType === 'concept' && !isChapter1 && !isUserPro;

                  return (
                    <div
                      key={ch.name}
                      className="w-full bg-white dark:bg-[#3B0F6E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all flex flex-col gap-3 group relative"
                    >
                      {/* Chapter Title & Number Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                            {sortKey !== 999 ? sortKey : '#'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2">
                              {ch.name}
                            </h4>
                            <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635] mt-0.5">
                              {selectedSubject}
                            </p>
                          </div>
                        </div>

                        {/* Top lock badge if concept quiz ch.2+ is locked */}
                        {isConceptLocked && (
                          <span className="px-2.5 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] text-[10px] font-black flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>Pro</span>
                          </span>
                        )}
                      </div>

                      {/* Chapter Quiz Rows */}
                      <div className="pt-2 border-t border-[#FAF5FF] dark:border-[#230542] space-y-2">
                        {/* Quiz Row 1: Book-back One-words (Fully free) */}
                        <div
                          onClick={() =>
                            handleInitiateQuiz(
                              ch.name,
                              index,
                              'oneword',
                              ch.onewordCount
                            )
                          }
                          className="p-2.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] border border-[#EDE9FE] dark:border-[#DDD6FE]/15 flex items-center justify-between gap-2 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635] shrink-0" />
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                              Book-back One-words
                            </span>
                            <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 shrink-0">
                              · {ch.onewordCount > 0 ? ch.onewordCount : 10} Qs
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-black text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] px-2 py-0.5 rounded-md shadow-2xs">
                              free ✨
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateQuiz(
                                  ch.name,
                                  index,
                                  'oneword',
                                  ch.onewordCount
                                );
                              }}
                              className="w-8 h-8 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                              aria-label="Start one-words test"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quiz Row 2: Concept Quiz (Ch. 1 free sample, Ch. 2+ Pro locked) */}
                        <div
                          onClick={() =>
                            handleInitiateQuiz(
                              ch.name,
                              index,
                              'concept',
                              ch.conceptCount
                            )
                          }
                          className="p-2.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] border border-[#EDE9FE] dark:border-[#DDD6FE]/15 flex items-center justify-between gap-2 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Brain className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635] shrink-0" />
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                              Concept Quiz
                            </span>
                            <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 shrink-0">
                              · {ch.conceptCount > 0 ? ch.conceptCount : 10} Qs
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isChapter1 || isUserPro ? (
                              <>
                                <span className="text-[10px] font-black text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] px-2 py-0.5 rounded-md shadow-2xs">
                                  {isChapter1 ? 'sample 🎁' : 'Pro ✨'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInitiateQuiz(
                                      ch.name,
                                      index,
                                      'concept',
                                      ch.conceptCount
                                    );
                                  }}
                                  className="w-8 h-8 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                  aria-label="Start concept quiz"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-black text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Pro</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPaywall(
                                      texts.testTypes.conceptSampleNote ||
                                        'chapter 1 is free — the rest glows behind Pro ✨'
                                    );
                                  }}
                                  className="w-8 h-8 rounded-lg bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center hover:bg-[#F3E8FF] transition-all cursor-pointer shadow-xs"
                                  aria-label="Unlock Pro concept quiz"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* START FLOW: Slide-up confirmation card */}
      {/* Nothing starts until a chapter/test card is tapped → then slide-up confirmation card */}
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
