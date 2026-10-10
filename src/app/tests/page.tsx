'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
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
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  getCanonicalSubjects,
  normalizeSubject,
} from '@/data/canonicalSubjects';
import { ProUpsellModal, ProUpsellContext } from '@/components/ProUpsellModal';

export interface ChapterItem {
  rawName: string;
  discipline?: 'History' | 'Geography' | 'Civics' | 'Economics';
  number: number;
  displayName: string;
  cleanTitle: string;
  sortKey: number;
  poolSize: number;
  onewordCount: number;
  conceptCount: number;
  isMegaSet?: boolean;
}

export function parseChapterDetails(
  rawName: string,
  poolSize = 0,
  onewordCount = 0,
  conceptCount = 0
): ChapterItem {
  const str = (rawName || '').trim();

  // Social Science sub-chapter discipline matching
  // 1. History / வரலாறு
  const histMatch = str.match(/^(?:history|வரலாறு)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (histMatch) {
    const num = parseInt(histMatch[1], 10);
    const isTa = str.includes('வரலாறு');
    return {
      rawName: str,
      discipline: 'History',
      number: num,
      displayName: isTa ? `வரலாறு ${num}` : `History ${num}`,
      cleanTitle: histMatch[2]?.trim() || str,
      sortKey: 1000 + num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  // 2. Geography / புவியியல்
  const geoMatch = str.match(/^(?:geography|புவியியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (geoMatch) {
    const num = parseInt(geoMatch[1], 10);
    const isTa = str.includes('புவியியல்');
    return {
      rawName: str,
      discipline: 'Geography',
      number: num,
      displayName: isTa ? `புவியியல் ${num}` : `Geography ${num}`,
      cleanTitle: geoMatch[2]?.trim() || str,
      sortKey: 2000 + num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  // 3. Civics / குடிமையியல்
  const civMatch = str.match(/^(?:civics|குடிமையியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (civMatch) {
    const num = parseInt(civMatch[1], 10);
    const isTa = str.includes('குடிமையியல்');
    return {
      rawName: str,
      discipline: 'Civics',
      number: num,
      displayName: isTa ? `குடிமையியல் ${num}` : `Civics ${num}`,
      cleanTitle: civMatch[2]?.trim() || str,
      sortKey: 3000 + num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  // 4. Economics / பொருளியல்
  const ecoMatch = str.match(/^(?:economics|பொருளியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (ecoMatch) {
    const num = parseInt(ecoMatch[1], 10);
    const isTa = str.includes('பொருளியல்');
    return {
      rawName: str,
      discipline: 'Economics',
      number: num,
      displayName: isTa ? `பொருளியல் ${num}` : `Economics ${num}`,
      cleanTitle: ecoMatch[2]?.trim() || str,
      sortKey: 4000 + num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  // Standard Chapter 1..N / அலகு 1..N
  const stdMatch = str.match(/^(?:chapter|unit|ch|அலகு|பாடம்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (stdMatch) {
    const num = parseInt(stdMatch[1], 10);
    const isTa = str.includes('அலகு') || str.includes('பாடம்');
    return {
      rawName: str,
      number: num,
      displayName: isTa ? `அலகு ${num}` : `Chapter ${num}`,
      cleanTitle: stdMatch[2]?.trim() || str,
      sortKey: num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  // Pure leading number: e.g. "1. Relations and Functions"
  const leadingNumMatch = str.match(/^(\d+)\s*[-–:.]\s*(.*)/);
  if (leadingNumMatch) {
    const num = parseInt(leadingNumMatch[1], 10);
    return {
      rawName: str,
      number: num,
      displayName: `Chapter ${num}`,
      cleanTitle: leadingNumMatch[2]?.trim() || str,
      sortKey: num,
      poolSize,
      onewordCount,
      conceptCount,
    };
  }

  return {
    rawName: str,
    number: 999,
    displayName: str,
    cleanTitle: str,
    sortKey: 999,
    poolSize,
    onewordCount,
    conceptCount,
  };
}

interface ConfirmationModalState {
  chapterName: string;
  type: TestType;
  typeLabel: string;
  count: number;
  poolSize: number;
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

  const effectiveStandard = isRegistered
    ? student?.standard || '10th'
    : guestStandard || '10th';

  const isUserPro =
    String(plan || '').toLowerCase() === 'pro' ||
    String(plan || '').toLowerCase() === 'live';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // 1. Quiz Type selection ('all' = Merged pool | 'oneword' | 'concept')
  const [selectedType, setSelectedType] = useState<TestType>('all');
  // 2. Select-subject expander state & selected subject
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  // 3. Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState | null>(null);
  const [mounted, setMounted] = useState(false);

  // Pro Upsell Modal state
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [upsellContext, setUpsellContext] = useState<ProUpsellContext>({
    subject: '',
    chapter: '',
    videoCount: 2,
    conceptCount: 18,
    paperCount: 12,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while confirmation modal is open
  useEffect(() => {
    if (confirmModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [confirmModal]);

  // Fetch questions from API with student's class, subject, and medium pooling BOTH types in parallel
  const fetchQuestions = (subjectToFetch?: string) => {
    const subj = subjectToFetch !== undefined ? subjectToFetch : selectedSubject;
    if (!subj) {
      setIsLoading(false);
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const streamParam = student?.stream ? `&stream=${encodeURIComponent(student.stream)}` : '';
    const base = `/api/questions?classLevel=${encodeURIComponent(effectiveStandard)}&subject=${encodeURIComponent(subj)}&medium=${encodeURIComponent(medium || 'english')}&count=all${streamParam}`;

    Promise.all([
      fetch(`${base}&type=oneword`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${base}&type=concept`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([onewordData, conceptData]) => {
        const list1: Question[] = Array.isArray(onewordData?.questions) ? onewordData.questions : [];
        const list2: Question[] = Array.isArray(conceptData?.questions) ? conceptData.questions : [];
        const combined: Question[] = [];
        const seen = new Set<string>();

        for (const q of [...list1, ...list2]) {
          if (q && q.id && !seen.has(q.id)) {
            seen.add(q.id);
            combined.push(q);
          }
        }

        setQuestions(combined);
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setQuestions([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions(selectedSubject);
    } else {
      setIsLoading(false);
      setQuestions([]);
    }
  }, [medium, effectiveStandard, student?.stream, selectedSubject]);

  // Track previous standard/medium to only reset when they actually change
  const prevStandardRef = useRef(effectiveStandard);
  const prevMediumRef = useRef(medium);

  useEffect(() => {
    if (prevStandardRef.current !== effectiveStandard || prevMediumRef.current !== medium) {
      prevStandardRef.current = effectiveStandard;
      prevMediumRef.current = medium;
      setSelectedSubject('');
    }
  }, [medium, effectiveStandard]);

  const availableSubjects = useMemo(() => {
    return getCanonicalSubjects(effectiveStandard, student?.stream);
  }, [effectiveStandard, student?.stream]);

  useEffect(() => {
    if (
      selectedSubject &&
      !availableSubjects.some((s) => s.toLowerCase() === selectedSubject.toLowerCase())
    ) {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedSubject]);

  // Build POOLED chapter list & discipline mega-sets (TASK A)
  // 1. Every chapter set pools both oneword + concept questions
  // 2. Chapters with poolSize < 10 are hidden; their questions flow into mega-set
  // 3. Top card: "Practice — All chapters" (or per discipline for Social Science)
  const isSocial = useMemo(() => {
    return normalizeSubject(selectedSubject).toLowerCase().includes('social');
  }, [selectedSubject]);

  const { megaSets, chapterCards } = useMemo(() => {
    if (!selectedSubject || questions.length === 0) {
      return { megaSets: [], chapterCards: [] };
    }

    const filtered = questions.filter((q) => {
      const matchSubj = normalizeSubject(q.subject) === normalizeSubject(selectedSubject);
      if (!matchSubj) return false;
      if (selectedType === 'all') return true;
      return (q.type || 'oneword').toLowerCase() === selectedType.toLowerCase();
    });

    const isTamilMedium = medium === 'tamil';

    if (isSocial) {
      // Social Science: Discipline Split (History, Geography, Civics, Economics)
      const disciplines: Array<{ id: 'History' | 'Geography' | 'Civics' | 'Economics'; en: string; ta: string }> = [
        { id: 'History', en: 'History', ta: 'வரலாறு' },
        { id: 'Geography', en: 'Geography', ta: 'புவியியல்' },
        { id: 'Civics', en: 'Civics', ta: 'குடிமையியல்' },
        { id: 'Economics', en: 'Economics', ta: 'பொருளியல்' },
      ];

      const discMegaSets: ChapterItem[] = [];
      const visibleChapters: ChapterItem[] = [];

      disciplines.forEach((disc) => {
        const discQuestions = filtered.filter((q) => {
          const c = String(q.chapter || '').toLowerCase();
          return c.includes(disc.en.toLowerCase()) || c.includes(disc.ta);
        });

        if (discQuestions.length > 0) {
          // Mega-set for this discipline
          discMegaSets.push({
            rawName: `Practice — all ${disc.en}`,
            discipline: disc.id,
            number: 0,
            displayName: isTamilMedium ? `✨ ${disc.ta} — அனைத்து அலகுகள் பயிற்சி` : `✨ Practice — all ${disc.en}`,
            cleanTitle: isTamilMedium ? 'அனைத்து அலகுகளும் இணைந்த பயிற்சி' : 'Pooled discipline practice set',
            sortKey: disc.id === 'History' ? 100 : disc.id === 'Geography' ? 200 : disc.id === 'Civics' ? 300 : 400,
            poolSize: discQuestions.length,
            onewordCount: discQuestions.filter((q) => (q.type || 'oneword').toLowerCase() === 'oneword').length,
            conceptCount: discQuestions.filter((q) => (q.type || 'oneword').toLowerCase() === 'concept').length,
            isMegaSet: true,
          });

          // Group by chapter within discipline
          const chapMap = new Map<string, { poolSize: number; oneword: number; concept: number }>();
          discQuestions.forEach((q) => {
            const ch = (q.chapter || `${disc.en} 1`).trim();
            const curr = chapMap.get(ch) || { poolSize: 0, oneword: 0, concept: 0 };
            curr.poolSize++;
            if ((q.type || 'oneword').toLowerCase() === 'concept') curr.concept++;
            else curr.oneword++;
            chapMap.set(ch, curr);
          });

          chapMap.forEach((stats, rawName) => {
            // Min-10 rule: only show chapters with poolSize >= 10
            if (stats.poolSize >= 10) {
              visibleChapters.push(parseChapterDetails(rawName, stats.poolSize, stats.oneword, stats.concept));
            }
          });
        }
      });

      visibleChapters.sort((a, b) => a.sortKey - b.sortKey);
      return { megaSets: discMegaSets, chapterCards: visibleChapters };
    }

    // Standard subjects (Maths, Science, English, Tamil)
    const chapMap = new Map<string, { poolSize: number; oneword: number; concept: number }>();
    filtered.forEach((q) => {
      const ch = (q.chapter || 'Chapter 1').trim();
      const curr = chapMap.get(ch) || { poolSize: 0, oneword: 0, concept: 0 };
      curr.poolSize++;
      if ((q.type || 'oneword').toLowerCase() === 'concept') curr.concept++;
      else curr.oneword++;
      chapMap.set(ch, curr);
    });

    const visibleChapters: ChapterItem[] = [];
    chapMap.forEach((stats, rawName) => {
      // Min-10 rule: only show chapters with poolSize >= 10
      if (stats.poolSize >= 10) {
        visibleChapters.push(parseChapterDetails(rawName, stats.poolSize, stats.oneword, stats.concept));
      }
    });

    visibleChapters.sort((a, b) => a.sortKey - b.sortKey);

    const mainMegaSet: ChapterItem[] = [
      {
        rawName: 'Practice — All chapters',
        number: 0,
        displayName: isTamilMedium ? '✨ அனைத்து அலகுகளும் பயிற்சி' : '✨ Practice — All chapters',
        cleanTitle: isTamilMedium ? 'அனைத்து அலகுகளும் இணைந்த மெகா தேர்வு' : 'Pooled all chapters practice set',
        sortKey: 0,
        poolSize: filtered.length,
        onewordCount: filtered.filter((q) => (q.type || 'oneword').toLowerCase() === 'oneword').length,
        conceptCount: filtered.filter((q) => (q.type || 'oneword').toLowerCase() === 'concept').length,
        isMegaSet: true,
      },
    ];

    return { megaSets: mainMegaSet, chapterCards: visibleChapters };
  }, [questions, selectedSubject, selectedType, isSocial, medium]);

  // Tap on a chapter card or mega-set
  const handleChapterTap = (ch: ChapterItem, index: number) => {
    const isChapter1 = index === 0 || ch.sortKey === 1 || ch.sortKey === 1001 || ch.isMegaSet;

    // Gate rule: Concept quiz chapters 2+ require Pro
    if (selectedType === 'concept' && !isChapter1 && !isUserPro) {
      setUpsellContext({
        subject: selectedSubject || 'Maths',
        chapter: ch.cleanTitle || ch.displayName,
        conceptCount: ch.conceptCount || ch.poolSize || 18,
        videoCount: 2,
        paperCount: 12,
      });
      setUpsellModalOpen(true);
      return;
    }

    if (!isRegistered) {
      openGate(() => {
        showConfirmation(ch);
      });
      return;
    }

    showConfirmation(ch);
  };

  const showConfirmation = (ch: ChapterItem) => {
    // 15 questions randomized sample
    const count = Math.min(ch.poolSize, 15);
    const testKey = `${effectiveStandard}_${selectedSubject}_${ch.rawName}_${selectedType}`;

    const typeLabel =
      selectedType === 'all'
        ? 'Merged (Book-back + Concept)'
        : selectedType === 'concept'
        ? texts.tests.concept
        : texts.tests.oneword;

    setConfirmModal({
      chapterName: ch.rawName,
      type: selectedType,
      typeLabel,
      count,
      poolSize: ch.poolSize,
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
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#F5F0FF]">
            {texts.tests.headline}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.tests.subheadline}
          </p>
        </div>

        {/* Standard selector for guests, or fixed badge for registered students */}
        {!isRegistered ? (
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white dark:bg-[#1B0B2E] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs max-w-[210px] sm:max-w-none">
            {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => {
              const isSelected = effectiveStandard.replace(/\D/g, '') === cls.replace(/\D/g, '');
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setGuestStandard(cls);
                    setSelectedSubject('');
                  }}
                  className={`min-h-[32px] px-2 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-[#6D28D9] dark:text-[#A78BFA] hover:bg-[#FAF5FF] dark:hover:bg-[#2A1247]'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#A3E635] text-[#18181B] text-xs font-black shadow-xs">
              {effectiveStandard}
            </span>
          </div>
        )}
      </div>

      {/* If standard has no canonical subjects: Honest Friendly Empty State */}
      {availableSubjects.length === 0 ? (
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-8 text-center border border-[#EDE9FE] dark:border-[#3B2063] shadow-md flex flex-col items-center justify-center my-6 animate-fade-in">
          <span className="text-5xl mb-3">🌱</span>
          <h2 className="text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] mb-1">
            {texts.tests.lessonsArrivingSoon}
          </h2>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] mb-6 max-w-xs">
            {effectiveStandard} {texts.tests.contentCookingNotice || 'lessons and chapter tests are arriving this week 🌱'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#FAF5FF] text-xs font-black shadow-xs hover:bg-[#FAF5FF] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{texts.tests.back || 'Back'}</span>
            </button>
            <Link
              href="/"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{texts.home.backToMyHome || 'Home 🏠'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick-jump filter chips: [ 📚 Book-back ] [ 🧠 Concept ] */}
          <div className="grid grid-cols-2 gap-3">
            {/* Box 1: [📖 book-back \n one-words] */}
            <button
              type="button"
              onClick={() => setSelectedType((prev) => (prev === 'oneword' ? 'all' : 'oneword'))}
              className={`min-h-[88px] p-3 rounded-3xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                selectedType === 'oneword'
                  ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/25 scale-[1.01]'
                  : selectedType === 'all'
                  ? 'bg-[#FAF5FF] dark:bg-[#230D3E] text-[#2E1065] dark:text-[#F5F0FF] border-[#DDD6FE] dark:border-[#5B21B6] hover:border-[#7C3AED]/40 shadow-xs'
                  : 'bg-white dark:bg-[#1B0B2E] text-[#2E1065]/60 dark:text-[#F5F0FF]/60 border-[#EDE9FE] dark:border-[#3B2063] opacity-75'
              }`}
            >
              <span className="text-sm sm:text-base font-black tracking-tight">
                📚 {texts.tests.bookBackLine1 || 'book-back'}
              </span>
              <span className="text-xs font-bold opacity-90">
                {selectedType === 'oneword' ? '✓ filtered' : texts.tests.bookBackLine2 || 'one-words'}
              </span>
            </button>

            {/* Box 2: [🧠 concept quiz] */}
            <button
              type="button"
              onClick={() => setSelectedType((prev) => (prev === 'concept' ? 'all' : 'concept'))}
              className={`min-h-[88px] p-3 rounded-3xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                selectedType === 'concept'
                  ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/25 scale-[1.01]'
                  : selectedType === 'all'
                  ? 'bg-[#FAF5FF] dark:bg-[#230D3E] text-[#2E1065] dark:text-[#F5F0FF] border-[#DDD6FE] dark:border-[#5B21B6] hover:border-[#7C3AED]/40 shadow-xs'
                  : 'bg-white dark:bg-[#1B0B2E] text-[#2E1065]/60 dark:text-[#F5F0FF]/60 border-[#EDE9FE] dark:border-[#3B2063] opacity-75'
              }`}
            >
              <span className="text-sm sm:text-base font-black tracking-tight">
                🧠 {texts.tests.conceptQuiz}
              </span>
              <span className="text-xs font-bold opacity-90">
                {selectedType === 'concept' ? '✓ filtered' : texts.tests.allChapters || 'all chapters'}
              </span>
            </button>
          </div>

          {/* Row 2: PRO QUIZ BOX - min-h-[64px], restored sleek pre-R7 styling */}
          <button
            type="button"
            onClick={() => openPaywall(texts.tests.proQuizPitch)}
            className="w-full min-h-[64px] px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border-2 border-amber-400 dark:border-amber-400/80 bg-gradient-to-r from-amber-400/15 via-yellow-400/20 to-amber-500/25 dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-amber-400/25 text-[#2E1065] dark:text-[#F5F0FF] shadow-xs hover:shadow-md dark:shadow-amber-500/10 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl group-hover:scale-110 transition-transform">⚡</span>
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

          {/* Row 3: SELECT SUBJECT CTA */}
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
                onClick={() => fetchQuestions()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer"
              >
                retry 🔄
              </button>
            </div>
          ) : (
            <div className="pt-1">
              {megaSets.length === 0 && chapterCards.length === 0 ? (
                <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-8 text-center border border-[#EDE9FE] dark:border-[#3B2063]">
                  <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                    {texts.tests.noChaptersYet}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* TOP CARD(S): "Practice — All chapters" Mega-Set (Pooled across chapters, 15 questions randomized) */}
                  {megaSets.map((mega, mIdx) => (
                    <div
                      key={mega.rawName}
                      onClick={() => handleChapterTap(mega, mIdx)}
                      className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-white to-purple-500/10 dark:from-purple-950/40 dark:via-[#1B0B2E] dark:to-purple-950/40 border-2 border-[#7C3AED]/40 hover:border-[#7C3AED] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-left group"
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                        <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate">
                          {mega.displayName} · {mega.poolSize} Q
                        </span>
                      </div>

                      <span className="w-7 h-7 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </span>
                    </div>
                  ))}

                  {/* Restored Pre-R7 Sleek Chapter Cards (Only poolSize >= 10 rendered) */}
                  {chapterCards.map((ch, index) => {
                    const isChapter1 = index === 0 || ch.sortKey === 1 || ch.sortKey === 1001;
                    const isLocked = selectedType === 'concept' && !isChapter1 && !isUserPro;

                    // Sleek single-line label matching pre-R7: "Chapter 1 · Relations and Functions · 23 Q"
                    const displayRow = `${ch.displayName} · ${ch.cleanTitle} · ${ch.poolSize} Q`;

                    return (
                      <div
                        key={ch.rawName}
                        data-testid={isLocked ? 'concept-ch2-locked' : 'concept-ch1-playable'}
                        onClick={() => handleChapterTap(ch, index)}
                        className={`w-full min-h-[50px] px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left group ${
                          isLocked
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/40 hover:border-amber-500'
                            : 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          {isLocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/25 text-amber-900 dark:text-amber-200 shrink-0">
                              Pro 🔒
                            </span>
                          )}
                          <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate">
                            {displayRow}
                          </span>
                        </div>

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
      )}

      {/* Restored Pre-R7 Clean Confirmation Modal with 15 questions launch */}
      {confirmModal && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Test Start"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 shadow-2xl border border-[#EDE9FE] dark:border-[#3B2063] max-h-[90dvh] overflow-y-auto flex flex-col gap-4 text-[#2E1065] dark:text-[#F5F0FF] transition-colors"
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
                className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-[#6D28D9] dark:text-[#B9A6D9] flex items-center justify-center hover:bg-[#EDE9FE] dark:hover:bg-[#3B2063] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Details Card (Restored Pre-R7 Sleek Style) */}
            <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] space-y-2">
              <h3 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                {confirmModal.chapterName}
              </h3>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-black text-[#7C3AED] dark:text-[#A78BFA] bg-white dark:bg-[#1B0B2E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#3B2063] shadow-2xs">
                  {effectiveStandard} · {selectedSubject}
                </span>
                <span className="text-[11px] font-black text-[#2E1065] dark:text-[#F5F0FF] bg-white dark:bg-[#1B0B2E] px-2.5 py-1 rounded-lg border border-[#EDE9FE] dark:border-[#3B2063] shadow-2xs">
                  {confirmModal.typeLabel}
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
        </div>,
        document.body
      )}

      {/* Pro Upsell Modal */}
      <ProUpsellModal
        isOpen={upsellModalOpen}
        onClose={() => setUpsellModalOpen(false)}
        context={upsellContext}
      />
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
