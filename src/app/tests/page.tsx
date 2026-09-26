'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TestType, Question } from '@/types';
import { SkeletonCard } from '@/components/SkeletonCard';
import {
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
    ? String(student?.standard || '').trim().toLowerCase() === '12th'
      ? '12th'
      : '10th'
    : guestStandard || '10th';

  const isUserPro = String(plan || '').toLowerCase() === 'pro' || String(plan || '').toLowerCase() === 'live';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // 1. Quiz Type selection ('oneword' | 'concept')
  const [selectedType, setSelectedType] = useState<TestType>('oneword');
  // 2. Select-subject expander state & selected subject (EMPTY placeholder by default, NO preselection)
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  // 3. Slide-up confirmation modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState | null>(null);

  // Fetch questions from API
  const fetchQuestions = () => {
    setIsLoading(true);
    setIsError(false);

    fetch(`/api/questions?medium=${medium}`)
      .then(async (res) => {
        if (!res.ok) {
          setIsError(true);
          setQuestions([]);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        } else {
          setIsError(true);
          setQuestions([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setQuestions([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchQuestions();
  }, [medium]);

  // Questions filtered strictly by user's standard (10th vs 12th)
  const standardQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qStd = String(q.classLevel || (q as unknown as { standard?: string }).standard || '').trim().toLowerCase();
      const normQStd = qStd === '12' || qStd === '12th' ? '12th' : '10th';
      return normQStd === effectiveStandard;
    });
  }, [questions, effectiveStandard]);

  // Extract unique subjects for this standard
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    standardQuestions.forEach((q) => {
      if (q.subject) {
        set.add(normalizeSubject(q.subject));
      }
    });
    return Array.from(set).sort();
  }, [standardQuestions]);

  // When standardQuestions change, if selectedSubject is not in availableSubjects, reset it
  useEffect(() => {
    if (selectedSubject && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedSubject]);

  // Once a subject is selected, get chapters for this standard + subject + selected quiz type
  const subjectChapters = useMemo(() => {
    if (!selectedSubject) return [];

    const map = new Map<string, { name: string; count: number }>();

    standardQuestions
      .filter((q) => {
        const matchesSubject = normalizeSubject(q.subject) === selectedSubject;
        const matchesType = (q.type || 'oneword') === selectedType;
        return matchesSubject && matchesType;
      })
      .forEach((q) => {
        const chName = (q.chapter || 'Chapter 1').trim();
        const existing = map.get(chName);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(chName, { name: chName, count: 1 });
        }
      });

    return Array.from(map.values()).sort(
      (a, b) => getChapterSortKey(a.name) - getChapterSortKey(b.name)
    );
  }, [standardQuestions, selectedSubject, selectedType]);

  // Tap on a chapter row
  const handleChapterTap = (chapterName: string, index: number) => {
    const sortKey = getChapterSortKey(chapterName);
    const isChapter1 = index === 0 || sortKey === 1;

    // Gate rule: Concept quiz chapters 2+ require Pro
    if (selectedType === 'concept' && !isChapter1 && !isUserPro) {
      openPaywall(texts.tests.proQuizPitch);
      return;
    }

    // Guest registration gate check
    if (!isRegistered) {
      openGate(() => {
        showConfirmation(chapterName);
      });
      return;
    }

    showConfirmation(chapterName);
  };

  const showConfirmation = (chapterName: string) => {
    const chData = subjectChapters.find((c) => c.name === chapterName);
    const count = chData?.count || 10;
    const testKey = `${effectiveStandard}_${selectedSubject}_${chapterName}_${selectedType}`;

    setConfirmModal({
      chapterName,
      type: selectedType,
      count,
      testKey,
    });
  };

  const handleConfirmStart = () => {
    if (!confirmModal) return;
    const params = new URLSearchParams({
      subject: selectedSubject,
      chapter: confirmModal.chapterName,
      type: confirmModal.type,
      standard: effectiveStandard,
      count: String(confirmModal.count),
    });
    setConfirmModal(null);
    router.push(`/test-runner?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#F5F0FF]">
            {texts.tests.headline}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.tests.subheadline}
          </p>
        </div>

        {/* Standard chip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-3 py-1 rounded-full bg-[#A3E635] text-[#18181B] text-xs font-black shadow-xs">
            {effectiveStandard}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: TWO BIG equal boxes (grid-cols-2, min-h-[96px]) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Box 1: [📖 book-back \n one-words] */}
          <button
            type="button"
            onClick={() => setSelectedType('oneword')}
            className={`min-h-[96px] p-3 rounded-3xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
              selectedType === 'oneword'
                ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/25 scale-[1.01]'
                : 'bg-white dark:bg-[#1B0B2E] text-[#2E1065] dark:text-[#F5F0FF] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs'
            }`}
          >
            <span className="text-base font-black tracking-tight">
              📚 {texts.tests.bookBackLine1 || 'book-back'}
            </span>
            <span className="text-xs font-bold opacity-90">
              {texts.tests.bookBackLine2 || 'one-words'}
            </span>
          </button>

          {/* Box 2: [🧠 concept quiz] */}
          <button
            type="button"
            onClick={() => setSelectedType('concept')}
            className={`min-h-[96px] p-3 rounded-3xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
              selectedType === 'concept'
                ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/25 scale-[1.01]'
                : 'bg-white dark:bg-[#1B0B2E] text-[#2E1065] dark:text-[#F5F0FF] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs'
            }`}
          >
            <span className="text-base font-black tracking-tight">
              🧠 {texts.tests.conceptQuiz}
            </span>
            <span className="text-xs font-bold opacity-90">
              {texts.tests.allChapters || 'all chapters'}
            </span>
          </button>
        </div>

        {/* Row 2: PRO QUIZ BOX - min-h-[72px], border-2 gold, distinct premium identity */}
        <button
          type="button"
          onClick={() => openPaywall(texts.tests.proQuizPitch)}
          className="w-full min-h-[72px] px-4 py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between border-2 border-amber-400 dark:border-amber-400/80 bg-gradient-to-r from-amber-400/15 via-yellow-400/20 to-amber-500/25 dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-amber-400/25 text-[#2E1065] dark:text-[#F5F0FF] shadow-sm hover:shadow-md dark:shadow-amber-500/10 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 block leading-tight">
                {texts.tests.proQuizBox}
              </span>
              <span className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80">
                adaptive speed battles & deep concepts
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-xs border border-amber-300">
              Pro
            </span>
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-300" />
          </div>
        </button>

        {/* Row 3: SELECT SUBJECT CTA - Solid filled brand-purple box with white bold text + pulse-glow until picked */}
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            className={`w-full min-h-[50px] px-4 py-3 flex items-center justify-between text-xs font-black cursor-pointer transition-all ${
              !selectedSubject
                ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white animate-pulse-glow shadow-md shadow-[#7C3AED]/30'
                : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
            }`}
          >
            <span className="font-black text-sm tracking-wide">
              {selectedSubject ? `${selectedSubject} ▾` : texts.tests.selectSubjectPlaceholder}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white transition-transform duration-200 stroke-[3] ${
                isSubjectDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSubjectDropdownOpen && (
            <div className="p-2 border-t border-[#EDE9FE] dark:border-[#3B2063] space-y-1 animate-fade-in bg-white dark:bg-[#1B0B2E]">
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
                    className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-left text-xs font-black transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#2E1065] dark:text-[#F5F0FF] hover:bg-[#FAF5FF] dark:hover:bg-[#2A1247]'
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

        {/* Subordinate area below selector: muted prompt until a subject is picked */}
        {!selectedSubject ? (
          <div className="bg-[#FAF5FF]/60 dark:bg-[#0F0618]/60 rounded-2xl p-8 text-center border border-dashed border-[#DDD6FE] dark:border-[#3B2063]/60 shadow-xs">
            <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]/70">
              {texts.tests.pickSubjectPrompt}
            </p>
          </div>
        ) : isLoading ? (
          <SkeletonCard count={3} />
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">👻</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#B9A6D9] mb-3">
              {texts.states.signalGhost}
            </p>
            <button
              type="button"
              onClick={fetchQuestions}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer"
            >
              retry 🔄
            </button>
          </div>
        ) : (
          <div className="pt-1">
            {subjectChapters.length === 0 ? (
              <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-8 text-center border border-[#EDE9FE] dark:border-[#3B2063]">
                <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                  {texts.tests.noChaptersYet}
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

                  // Format: 1 · {chapter name}
                  const cleanName =
                    ch.name
                      .replace(/^(?:chapter|unit|ch)?\s*\d+\s*[:.-]?\s*/i, '')
                      .trim() || ch.name;
                  const displayRow = `${sortKey !== 999 ? sortKey : index + 1} · ${cleanName}`;

                  return (
                    <div
                      key={ch.name}
                      onClick={() => handleChapterTap(ch.name, index)}
                      className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-left group"
                    >
                      <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate">
                        {displayRow}
                      </span>

                      {isLocked ? (
                        <span className="p-1.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-400/30 shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* START FLOW: Slide-up confirmation card */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Test Start"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 shadow-2xl border border-[#EDE9FE] dark:border-[#3B2063] max-h-[85vh] overflow-y-auto animate-zoom-in flex flex-col gap-4 text-[#2E1065] dark:text-[#F5F0FF] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063]">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                  {texts.tests.readyToStart}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-[#6D28D9] dark:text-[#B9A6D9] flex items-center justify-center hover:bg-[#EDE9FE] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Details Card */}
            <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] space-y-2">
              <h3 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                {confirmModal.chapterName}
              </h3>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-black text-[#7C3AED] dark:text-[#A78BFA] bg-white dark:bg-[#1B0B2E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#3B2063] shadow-2xs">
                  {effectiveStandard} · {selectedSubject}
                </span>
                <span className="text-[11px] font-black text-[#2E1065] dark:text-[#F5F0FF] bg-white dark:bg-[#1B0B2E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#3B2063] shadow-2xs">
                  {confirmModal.type === 'concept'
                    ? texts.tests.concept
                    : texts.tests.oneword}
                </span>
                <span className="text-[11px] font-black text-[#18181B] bg-[#A3E635] px-2.5 py-1 rounded-lg shadow-2xs">
                  {confirmModal.count} questions
                </span>
              </div>
            </div>

            {/* "start →" Action Button */}
            <button
              type="button"
              onClick={handleConfirmStart}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#84CC16] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              <span>{texts.tests.startConfirmCta}</span>
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618]">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">loading tests... ⚡</p>
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}
