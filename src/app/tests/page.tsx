'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TestType, Question } from '@/types';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';
import { SkeletonCard } from '@/components/SkeletonCard';
import { BookOpen, Brain, Clock, Lock, Sparkles, Check, Play, Layers } from 'lucide-react';

// Extract number from chapter name for sorting (Chapter 1 first, etc.)
const getChapterSortKey = (name: string): number => {
  const match = name.match(/^(?:chapter|unit|ch)?\s*(\d+)/i) || name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
};

export default function TestsPage() {
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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Flow State: Step 1 (Subject), Step 2 (Chapter), Step 3 (Quiz Type)
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<TestType | 'pro'>('oneword');

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

  // Step 1: Subjects existing in the Questions data for this standard
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    currentPool.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    // Fallback if pool is empty for this medium
    if (set.size === 0) {
      if (effectiveStandard === '12th') {
        return ['Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
      }
      return ['Maths', 'Science', 'Social Science', 'Tamil', 'English'];
    }
    return Array.from(set).sort();
  }, [currentPool, effectiveStandard]);

  // Auto-select first subject if none selected or not in available list
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubject || !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
        setSelectedChapter('all');
      }
    }
  }, [availableSubjects, selectedSubject]);

  // Step 2: Chapters of THAT subject only, sorted by leading number
  const subjectChapters = useMemo(() => {
    if (!selectedSubject) return [];

    const map = new Map<string, { name: string; count: number; hasPro: boolean }>();
    currentPool
      .filter((q) => q.subject.toLowerCase() === selectedSubject.toLowerCase())
      .forEach((q) => {
        const ch = q.chapter || 'General';
        if (!map.has(ch)) {
          map.set(ch, { name: ch, count: 1, hasPro: q.plan === 'pro' });
        } else {
          const item = map.get(ch)!;
          item.count += 1;
          if (q.plan === 'pro') item.hasPro = true;
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

  const isUserPro = plan === 'pro' || plan === 'live';

  const handleStartTest = (typeOverride?: TestType | 'pro') => {
    const typeToUse = typeOverride || selectedType;

    // If Pro quiz is tapped:
    if (typeToUse === 'pro') {
      if (!isRegistered) {
        openGate(() => {
          if (!isUserPro) {
            openPaywall();
          } else {
            const testKey = `${effectiveStandard}_${selectedSubject}_${selectedChapter}_oneword`;
            router.push(`/tests/${encodeURIComponent(testKey)}`);
          }
        });
        return;
      }

      if (!isUserPro) {
        openPaywall();
        return;
      }

      // Pro user: launch timed battle
      const testKey = `${effectiveStandard}_${selectedSubject}_${selectedChapter}_oneword`;
      router.push(`/tests/${encodeURIComponent(testKey)}`);
      return;
    }

    // Free test (oneword / concept):
    const testKey = `${effectiveStandard}_${selectedSubject}_${selectedChapter}_${typeToUse}`;
    const testUrl = `/tests/${encodeURIComponent(testKey)}`;

    if (!isRegistered) {
      openGate(() => {
        router.push(testUrl);
      });
      return;
    }

    router.push(testUrl);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in">
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
                    setSelectedChapter('all');
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
          {/* STEP 1: Subject Chips (Horizontal scroll) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] tracking-wider">
                1. Subject 📚
              </span>
              <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                {availableSubjects.length} available
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {availableSubjects.map((subj) => {
                const isSelected = selectedSubject === subj;
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subj);
                      setSelectedChapter('all');
                    }}
                    className={`min-h-[44px] px-4 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#2E1065] text-white border-[#2E1065] dark:bg-[#FAF5FF] dark:text-[#230542] dark:border-white shadow-xs scale-[1.02]'
                        : 'bg-white dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95]'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Chapters of THAT Subject only (sorted with leading number, plus "all chapters" chip) */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] tracking-wider">
                2. Chapter 📖
              </span>
              <button
                type="button"
                onClick={() => setSelectedChapter('all')}
                className={`min-h-[32px] px-3 rounded-full text-[11px] font-black transition-all cursor-pointer border ${
                  selectedChapter === 'all'
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                    : 'bg-white dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#A3E635] border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:bg-[#F3E8FF]'
                }`}
              >
                {texts.testTypes.allChapters} ✨
              </button>
            </div>

            {subjectChapters.length === 0 ? (
              <div className="bg-white dark:bg-[#3B0F6E] rounded-2xl p-6 text-center border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                  no chapters uploaded yet for this subject 👨‍🍳
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                {subjectChapters.map((ch) => {
                  const isSelected = selectedChapter === ch.name;
                  return (
                    <button
                      key={ch.name}
                      type="button"
                      onClick={() => setSelectedChapter(ch.name)}
                      className={`w-full min-h-[48px] p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                          : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] hover:border-[#7C3AED]/40 border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isSelected
                              ? 'bg-white/25 text-white'
                              : 'bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]'
                          }`}
                        >
                          {getChapterSortKey(ch.name) !== 999
                            ? getChapterSortKey(ch.name)
                            : '#'}
                        </div>
                        <span className="text-xs font-black truncate">{ch.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]'
                          }`}
                        >
                          {ch.count} Qs
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: Chips for Quiz Type + Start Button */}
          <div className="pt-2">
            <span className="block text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] tracking-wider mb-2.5 px-1">
              3. Quiz Type ⚡
            </span>

            <div className="space-y-2 mb-4">
              {/* Type 1: Book-back One-words */}
              <button
                type="button"
                onClick={() => setSelectedType('oneword')}
                className={`w-full min-h-[50px] p-3 rounded-2xl text-left font-black text-xs transition-all cursor-pointer flex items-center justify-between border ${
                  selectedType === 'oneword'
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                    : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>{texts.testTypes.oneword}</span>
                </div>
                {selectedType === 'oneword' && (
                  <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                )}
              </button>

              {/* Type 2: Concept Quiz */}
              <button
                type="button"
                onClick={() => setSelectedType('concept')}
                className={`w-full min-h-[50px] p-3 rounded-2xl text-left font-black text-xs transition-all cursor-pointer flex items-center justify-between border ${
                  selectedType === 'concept'
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                    : 'bg-white dark:bg-[#3B0F6E] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="w-4 h-4 shrink-0" />
                  <span>{texts.testTypes.concept}</span>
                </div>
                {selectedType === 'concept' && (
                  <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                )}
              </button>

              {/* Type 3: Locked Pro Quiz Type (tap opens PaywallSheet) */}
              <button
                type="button"
                onClick={() => handleStartTest('pro')}
                className="w-full min-h-[50px] p-3 rounded-2xl text-left font-black text-xs transition-all cursor-pointer flex items-center justify-between border bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF] dark:from-[#3B0F6E] dark:to-[#2E1065] border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED] text-[#2E1065] dark:text-[#FAF5FF] shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-md bg-[#7C3AED] text-white">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span>{texts.testTypes.proQuiz}</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] shadow-xs">
                  Pro 👑
                </span>
              </button>
            </div>

            {/* Start Test CTA Button */}
            <button
              type="button"
              onClick={() => handleStartTest()}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{texts.testTypes.startTest}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
