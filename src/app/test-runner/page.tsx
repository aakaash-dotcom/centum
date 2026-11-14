'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Question, QuizResult, UserAnswerRecord, TestType } from '@/types';
import { ScoreRing } from '@/components/ScoreRing';
import { normalizeSubject, isLegacyPooledChapter } from '@/data/canonicalSubjects';
import { isLanguageSubject } from '@/lib/data';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractChapterNumber } from '@/lib/gating';

function normalizeChapter(ch: string): string {
  return String(ch || '')
    .trim()
    .replace(/^(chapter|unit|ch|history|geography|civics|economics|அலகு|பாடம்|வரலாறு|புவியியல்|குடிமையியல்|பொருளியல்)\s*\d+\s*[-–:.]?\s*/i, '')
    .trim()
    .toLowerCase();
}

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function TestRunnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { medium, student, saveQuizResult, showToast } = useApp();

  const subjectParam = searchParams.get('subject') || '';
  const chapterParam = searchParams.get('chapter') || '';
  const typeParam = (searchParams.get('type') || '') as TestType;
  const standardParam = searchParams.get('standard') || '';
  const countParam = searchParams.get('count') || '';
  const quizIdParam = searchParams.get('quizId') || '';
  const mediumParam = searchParams.get('medium');

  const effectiveMedium =
    mediumParam === 'tamil' ? 'tamil' : mediumParam === 'english' ? 'english' : (medium || 'english');
  const isTa = effectiveMedium === 'tamil';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFallbackBackend, setIsFallbackBackend] = useState(false);
  const [isBrowserOffline, setIsBrowserOffline] = useState(false);
  const [isDiscontinuedFullPortion, setIsDiscontinuedFullPortion] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const updateStatus = () => {
      setIsBrowserOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    };
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const hasAnyExplanation = useMemo(() => {
    return questions.some((q) => Boolean(q.explanation && String(q.explanation).trim()));
  }, [questions]);

  const questionStartTimeRef = useRef<number>(0);
  const handleFinishQuizRef = useRef<() => void>(() => {});
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load and filter questions matching the exact URL contract
  const loadAndFilterQuestions = (shuffle = true) => {
    setIsLoading(true);
    setIsError(false);
    setIsDiscontinuedFullPortion(false);

    // Reject stale Full Portion / pooled practice links per Requirement 3
    const isSpecialType = (typeParam as string) === 'mock' || (typeParam as string) === 'pyq' || (typeParam as string) === 'daily';
    const isLegacyPooled = isLegacyPooledChapter(chapterParam) || (!chapterParam && !isSpecialType);

    if (isLegacyPooled) {
      setIsDiscontinuedFullPortion(true);
      setIsLoading(false);
      return;
    }

    const apiParams = new URLSearchParams();
    if (standardParam) apiParams.set('classLevel', standardParam);
    if (subjectParam) apiParams.set('subject', subjectParam);
    if (chapterParam) apiParams.set('chapter', chapterParam);
    if (typeParam && typeParam !== 'all') apiParams.set('type', typeParam);
    if (effectiveMedium) apiParams.set('medium', effectiveMedium);
    apiParams.set('count', 'all');
    if (student?.stream) apiParams.set('stream', student.stream);

    fetch(`/api/questions?${apiParams.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('questions fetch failed');
        return res.json();
      })
      .then((data) => {
        if (data?.servedFrom && data.servedFrom !== 'gas') {
          setIsFallbackBackend(true);
        }

        const pool: Question[] = data && Array.isArray(data.questions) ? data.questions : [];

        // If accessed directly without params, trigger graceful empty state
        if (!subjectParam && !chapterParam) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const normSubjParam = subjectParam.toLowerCase();
        const normStdParam = standardParam.replace(/th/gi, '').trim().toLowerCase();
        const userMed = String(effectiveMedium || '').trim().toLowerCase();

        const matched = pool.filter((q) => {
          // 0. Defensive structural validation (bad questions skipped, never crash session)
          if (
            !q ||
            typeof q.question !== 'string' ||
            !q.question.trim() ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            typeof q.answerIndex !== 'number' ||
            q.answerIndex < 0 ||
            q.answerIndex > 3
          ) {
            console.warn('[TestRunner] Skipping malformed question row:', q?.id);
            return false;
          }

          // 1. Subject mapper
          const qSubj = normalizeSubject(q.subject || '').toLowerCase();
          const matchSubj = !subjectParam || qSubj === normSubjParam;

          // 2. Chapter match: exact, normalized prefix stripped, or same chapter number
          const qChap = String(q.chapter || '').trim().toLowerCase();
          const targetChap = chapterParam.trim().toLowerCase();

          const normQ = normalizeChapter(q.chapter);
          const normT = normalizeChapter(chapterParam);
          const qNumMatch = qChap.match(/\b\d+\b/);
          const tNumMatch = targetChap.match(/\b\d+\b/);
          const qExtracted = extractChapterNumber(q.chapter);
          const tExtracted = extractChapterNumber(chapterParam);
          const sameNum = Boolean(
            (qNumMatch && tNumMatch && qNumMatch[0] === tNumMatch[0]) ||
            (qExtracted !== null && tExtracted !== null && qExtracted === tExtracted)
          );

          const isSpecialType = (typeParam as string) === 'mock' || (typeParam as string) === 'pyq' || (typeParam as string) === 'daily';
          const matchChap =
            !chapterParam ||
            isSpecialType ||
            qChap === targetChap ||
            Boolean(normQ && normT && (normQ === normT || qChap.includes(normT) || targetChap.includes(normQ))) ||
            sameNum;

          // 3. Class level: "10th" vs "10"
          const qStd = String(q.classLevel || '').replace(/th/gi, '').trim().toLowerCase();
          const matchStd = !standardParam || qStd === normStdParam;

          // 4. Type match if present (support type=all / pooled / mock / pyq / daily)
          const qType = String(q.type || '').trim().toLowerCase();
          const matchType =
            !typeParam ||
            typeParam.toLowerCase() === 'all' ||
            typeParam.toLowerCase() === 'mock' ||
            typeParam.toLowerCase() === 'pyq' ||
            typeParam.toLowerCase() === 'daily' ||
            qType === typeParam.toLowerCase();

          // 5. Medium match: Tamil & English subjects common to both; others strict medium match
          const isLang = isLanguageSubject(q.subject || '');
          const qMed = String(q.medium || '').trim().toLowerCase();
          const matchMedium = isLang || qMed === userMed || (userMed.length > 0 && qMed.startsWith(userMed.slice(0, 1)));

          return matchSubj && matchChap && matchStd && matchType && matchMedium;
        });

        const shuffled = shuffle ? [...matched].sort(() => Math.random() - 0.5) : matched;
        const parsedCount = parseInt(countParam, 10);
        const finalCount =
          parsedCount > 0
            ? parsedCount
            : countParam === 'all'
            ? shuffled.length
            : Math.min(shuffled.length, 15);
        const sliced = shuffled.slice(0, finalCount);

        setQuestions(sliced);
        // Total budget = count * 45s, min 60s
        setSecondsRemaining(Math.max(sliced.length * 45, 60));
        setCurrentIndex(0);
        setSelectedAnswers({});
        setQuestionTimes({});
        setIsFinished(false);
        setIsLoading(false);
        questionStartTimeRef.current = Date.now();
      })
      .catch((err) => {
        console.warn('Questions fetch error', err);
        setIsError(true);
        setQuestions([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadAndFilterQuestions();
  }, [medium, subjectParam, chapterParam, typeParam, standardParam, countParam, student?.stream]);

  const recordTimeForCurrentQuestion = () => {
    const now = Date.now();
    const start = questionStartTimeRef.current || now;
    const elapsed = Math.round((now - start) / 1000);
    setQuestionTimes((prev) => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + elapsed,
    }));
    questionStartTimeRef.current = now;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    recordTimeForCurrentQuestion();
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleFinishQuiz = () => {
    recordTimeForCurrentQuestion();
    setIsFinished(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    let correctCount = 0;
    const answerRecords: UserAnswerRecord[] = questions.map((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      const isCorrect = selected === q.answerIndex;
      if (isCorrect) correctCount += 1;
      return {
        questionId: q.id,
        selectedIndex: selected,
        isCorrect,
        timeSpentSeconds: questionTimes[idx] || 15,
      };
    });

    const total = questions.length;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
    const totalTime = Object.values(questionTimes).reduce((a, b) => a + b, 0);

    if (accuracy >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A3E635', '#F472B6'],
        });
      } catch {}
    }

    // Record schedule quiz completion if quizId present (e.g. sch_2026-09-26)
    if (quizIdParam) {
      try {
        localStorage.setItem(`centum_today_quiz_completed_${quizIdParam}`, 'true');
        const dateStr = quizIdParam.replace('sch_', '');
        localStorage.setItem(
          `centum_today_quiz_completed_${dateStr}_${standardParam}_${subjectParam}_${chapterParam}`,
          'true'
        );
        localStorage.setItem(`centum_today_quiz_completed_${dateStr}`, 'true');
      } catch {}
    }

    const firstQ = questions[0];
    const quizResult: QuizResult = {
      testId: quizIdParam || `tr_${standardParam || '10th'}_${subjectParam || 'Maths'}_${chapterParam || 'General'}_${typeParam || 'oneword'}`,
      title: firstQ ? `${firstQ.subject} - ${firstQ.chapter}` : `${subjectParam} - ${chapterParam}`,
      classLevel: standardParam || firstQ?.classLevel || '10th',
      subject: subjectParam || firstQ?.subject || 'Maths',
      chapter: chapterParam || firstQ?.chapter || 'Chapter',
      type: (typeParam === 'concept' ? 'concept' : 'oneword') as TestType,
      score: correctCount,
      total,
      accuracy,
      totalTimeSeconds: totalTime,
      answers: answerRecords,
      completedAt: new Date().toISOString(),
    };

    saveQuizResult(quizResult);
  };

  useEffect(() => {
    handleFinishQuizRef.current = handleFinishQuiz;
  });

  const handleNext = () => {
    recordTimeForCurrentQuestion();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleSkip = () => {
    recordTimeForCurrentQuestion();
    if (selectedAnswers[currentIndex] === undefined) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentIndex]: -1,
      }));
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  // Live timer countdown
  useEffect(() => {
    if (isLoading || isFinished || questions.length === 0) return;

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleFinishQuizRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLoading, isFinished, questions.length]);

  const handleRetake = () => {
    setIsFinished(false);
    setShowExplanations(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setQuestionTimes({});
    setExpandedReviews({});
    loadAndFilterQuestions(true);
    showToast(texts.tests.testShuffled);
  };

  const toggleReviewExpand = (idx: number) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [idx]: prev[idx] !== undefined ? !prev[idx] : false,
    }));
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-4" />
        <p className="text-sm font-black text-[#7C3AED] dark:text-[#A78BFA] animate-pulse">
          {texts.states.loading}
        </p>
      </div>
    );
  }

  // Discontinued Full Portion / Pooled practice state (Requirement 3)
  if (isDiscontinuedFullPortion) {
    const isTa = effectiveMedium === 'tamil';
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-[70vh] animate-fade-in">
        <div className="max-w-sm w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md flex flex-col items-center text-center">
          <span className="text-4xl mb-3">📋</span>
          <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug mb-2">
            {isTa ? 'முழுப் பகுதி பயிற்சி இனி கிடைக்காது' : 'Full Portion Practice Discontinued'}
          </h2>
          <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mb-6">
            {isTa
              ? 'பல அலகுகள் இணைந்த பயிற்சி நிறுத்தப்பட்டுள்ளது. தேர்வுப் பட்டியலிலிருந்து ஒரு குறிப்பிட்ட அலகைத் தேர்ந்தெடுக்கவும்.'
              : 'Pooled multi-chapter practice has been discontinued. Please choose an individual chapter from the test list.'}
          </p>
          <Link
            href="/tests"
            className="w-full min-h-[48px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>{isTa ? '← தேர்வுகள் பக்கத்திற்குத் திரும்பு' : '← Back to Tests'}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback Backend Empty State (Only render blocking error if NO questions could be matched/loaded)
  if (isFallbackBackend && questions.length === 0) {
    const isTa = effectiveMedium === 'tamil';
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-[70vh] animate-fade-in">
        <div className="max-w-sm w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl flex flex-col items-center text-center">
          <span className="text-4xl mb-3">⚠️</span>
          <h2 className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-300 leading-snug mb-2">
            {isTa ? 'தரவு இணைப்பு தற்காலிகமாக இல்லை' : 'Connection Temporarily Unavailable'}
          </h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-6">
            {isTa
              ? 'நேரடி வினாத்தாள் தரவுத்தள இணைப்பு தற்காலிகமாக கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
              : 'Live question database connection is temporarily unavailable. Please try again in a few moments.'}
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setIsFallbackBackend(false);
                loadAndFilterQuestions();
              }}
              className="w-full min-h-[44px] rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isTa ? 'மறுமுயற்சி 🔄' : 'Retry 🔄'}</span>
            </button>
            <Link
              href="/tests"
              className="w-full min-h-[44px] rounded-2xl bg-white dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#DDD6FE] text-xs font-black flex items-center justify-center gap-2 transition-all"
            >
              <span>{isTa ? '← தேர்வுகள் பக்கத்திற்குத் திரும்பு' : '← Back to Tests'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-[60vh]">
        <span className="text-4xl mb-3">👻</span>
        <p className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] mb-4">
          {texts.states.signalGhost}
        </p>
        <button
          type="button"
          onClick={() => loadAndFilterQuestions()}
          className="min-h-[44px] px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl text-xs font-black shadow-md shadow-[#7C3AED]/20 cursor-pointer transition-all"
        >
          {texts.tests.retry}
        </button>
      </div>
    );
  }

  // Empty match state: friendly in-page card (never blank or 404)
  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-[70vh] animate-fade-in">
        <div className="max-w-sm w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md flex flex-col items-center text-center">
          <span className="text-5xl mb-3">🌱</span>
          <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug mb-2">
            {texts.tests.noQuestionsFound}
          </h2>
          <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mb-6">
            {subjectParam || chapterParam
              ? `${subjectParam} ${chapterParam ? `· ${chapterParam}` : ''}`
              : texts.tests.chooseChapterPrompt}
          </p>
          <Link
            href="/tests"
            className="w-full min-h-[48px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>{texts.tests.backToTests}</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const userSelection = selectedAnswers[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isTimeCritical = secondsRemaining <= 60;

  // ================= RESULTS SCREEN =================
  if (isFinished) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answerIndex) correctCount += 1;
    });
    const totalCount = questions.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    const totalTime = Object.values(questionTimes).reduce((a, b) => a + b, 0);
    const coinsEarned = accuracy === 100 ? 5 : 2;

    return (
      <div className="flex-1 flex flex-col px-4 pt-4 pb-16 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF] max-w-md mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/tests"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] transition-all cursor-pointer shadow-xs"
            aria-label="Back to tests"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <span className="text-xs font-black text-[#7C3AED] dark:text-[#A78BFA] bg-[#FAF5FF] dark:bg-[#1B0B2E] px-3.5 py-1.5 rounded-full border border-[#DDD6FE] dark:border-[#3B2063] shadow-xs">
            {accuracy === 100
              ? texts.tests.perfectScore
              : accuracy >= 70
              ? texts.tests.goodScore
              : texts.tests.practiceMore}
          </span>
        </div>

        {/* Score Ring Hero Card */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md flex flex-col items-center justify-center text-center mb-4">
          <ScoreRing score={correctCount} total={totalCount} accuracy={accuracy} />

          {/* Coins Earned Callout */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/25 dark:from-amber-500/20 dark:to-yellow-500/25 border border-amber-300 dark:border-amber-400/40 text-amber-950 dark:text-amber-200 text-xs font-black mt-4">
            <span className="text-base animate-bounce-slight">🪙</span>
            <span>+{coinsEarned} {texts.tests.coinsEarned}</span>
          </div>

          {/* Metrics Grid */}
          <div className="w-full grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-[#FAF5FF] dark:border-[#2A1247]">
            <div className="p-3 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="block text-[10px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A78BFA]">
                {texts.tests.accuracy}
              </span>
              <span className="text-lg font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {Math.round(accuracy)}%
              </span>
            </div>
            <div className="p-3 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="block text-[10px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A78BFA]">
                {texts.tests.timeSpent}
              </span>
              <span className="text-lg font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {formatTimer(totalTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleRetake}
            className="min-h-[48px] rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>{texts.tests.retake}</span>
          </button>
          <Link
            href="/tests"
            className="min-h-[48px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-md shadow-[#7C3AED]/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <span>{texts.tests.backToTests}</span>
          </Link>
        </div>

        {/* Primary Button: See Explanations (when available) or Review Questions */}
        <button
          type="button"
          onClick={() => setShowExplanations((prev) => !prev)}
          className="w-full min-h-[50px] mb-6 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        >
          <span>
            {hasAnyExplanation
              ? showExplanations
                ? texts.tests.hideExplanations || 'Hide Explanations 📖'
                : texts.tests.seeExplanations || 'See Explanations 📖'
              : showExplanations
              ? 'Hide Questions Review 📝'
              : 'Review Questions & Answers 📝'}
          </span>
          {showExplanations ? (
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          ) : (
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          )}
        </button>

        {/* Question Review Section (Expanded via See Explanations) */}
        {showExplanations && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA]">
                {texts.tests.questionsReview} ({correctCount}/{totalCount})
              </h3>
            </div>

            {questions.map((q, idx) => {
              const userPick = selectedAnswers[idx];
              const isCorrect = userPick === q.answerIndex;
              const isSkipped = userPick === undefined || userPick === -1;
              const isExpanded = expandedReviews[idx] ?? true;
              const hasExplanation = Boolean(q.explanation && String(q.explanation).trim());

              return (
                <div
                  key={q.id || idx}
                  className="bg-white dark:bg-[#1B0B2E] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063] overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleReviewExpand(idx)}
                    className="w-full p-4 flex items-center justify-between text-left gap-3 cursor-pointer hover:bg-[#FAF5FF]/50 dark:hover:bg-[#2A1247]/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-[#A3E635]/20 text-[#14532D] dark:text-[#A3E635]'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] block">
                          q {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] truncate">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <span className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-[#FAF5FF] dark:border-[#0F0618] text-xs space-y-2.5 animate-fade-in">
                      <p className="font-extrabold text-[#2E1065] dark:text-[#F5F0FF] leading-relaxed pt-3">
                        {q.question}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        {(Array.isArray(q.options) ? q.options : []).map((opt, optIdx) => {
                          const isThisCorrect = optIdx === q.answerIndex;
                          const isThisUserPick = optIdx === userPick;

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                                isThisCorrect
                                  ? 'bg-[#A3E635]/15 border-[#84CC16] text-[#14532D] dark:text-[#A3E635]'
                                  : isThisUserPick
                                  ? 'bg-rose-500/15 border-rose-400 text-rose-800 dark:text-rose-200'
                                  : 'bg-[#FAF5FF] dark:bg-[#0F0618] border-[#EDE9FE] dark:border-[#3B2063] text-[#2E1065]/70 dark:text-[#F5F0FF]/70'
                              }`}
                            >
                              <span>{opt}</span>
                              {isThisCorrect && <span className="text-[10px] font-black">✓ {texts.tests.correctAnswer}</span>}
                              {isThisUserPick && !isThisCorrect && (
                                <span className="text-[10px] font-black">✗ {texts.tests.yourPick}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {isSkipped && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block pt-1">
                          ⚠️ {texts.tests.unanswered}
                        </span>
                      )}

                      {/* E2: Render explanation container ONLY if non-empty */}
                      {hasExplanation && q.explanation && String(q.explanation).trim() && (
                        <div className="p-3 rounded-xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] text-[11px] font-medium text-[#2E1065]/90 dark:text-[#F5F0FF]/90 mt-2">
                          <span className="font-black text-[#7C3AED] dark:text-[#A78BFA] block mb-0.5">
                            💡 {texts.tests.explanation}:
                          </span>
                          {String(q.explanation)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ================= ACTIVE QUIZ SCREEN =================
  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF] max-w-md mx-auto w-full">
      {/* Top Header: Back + Title + Timer */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] transition-all cursor-pointer shadow-xs shrink-0"
          aria-label="Exit quiz"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="min-w-0 text-center flex-1 px-1">
          <h1 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] truncate leading-tight">
            {subjectParam || texts.app.name}
          </h1>
          <p className="text-[10px] font-bold text-[#7C3AED] dark:text-[#A78BFA] truncate">
            {chapterParam || texts.tests.bookBackOneWords}
          </p>
        </div>

        {/* Live Timer Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black shadow-xs shrink-0 transition-colors ${
            isTimeCritical
              ? 'bg-rose-500/15 border-rose-400 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </div>

      {/* Offline / Saved Question Bank Status Indicator */}
      {isFallbackBackend && (
        <div
          role="status"
          data-testid="test-runner-offline-banner"
          className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] font-bold flex items-center gap-2"
        >
          <span>⚠️</span>
          <span>
            {isBrowserOffline
              ? (isTa
                  ? 'ஆஃப்லைன் பயிற்சி நிலை · மதிப்பெண் இந்த சாதனத்தில் மட்டும் சேமிக்கப்படும்'
                  : 'Offline practice mode · score saved locally to this device')
              : (isTa
                  ? 'சேமிக்கப்பட்ட வினாத்தாள் பயன்படுத்தப்படுகிறது · மதிப்பெண் இந்த சாதனத்தில் மட்டும் சேமிக்கப்படும்'
                  : 'Using saved question bank · score saved locally to this device')}
          </span>
        </div>
      )}

      {/* Progress Bar & Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-black text-[#6D28D9]/70 dark:text-[#B9A6D9] mb-1 px-0.5">
          <span>{texts.tests.questionProgress} {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#EDE9FE] dark:bg-[#2A1247] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A3E635] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {!currentQ || !Array.isArray(currentQ.options) || currentQ.options.length !== 4 ? (
            <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-amber-300 dark:border-amber-600/40 shadow-xs text-center">
              <span className="text-3xl mb-2 block">⚠️</span>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-4">
                This question could not be displayed properly.
              </p>
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black cursor-pointer transition-all shadow-md"
              >
                Skip Question →
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063] inline-block mb-2">
                  {texts.tests.questionProgress} {currentIndex + 1}
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-[#2E1065] dark:text-[#F5F0FF] leading-relaxed">
                  {currentQ.question}
                </h2>
              </div>

              {/* 4 Options Grid with Neutral Selected Highlight (Exam-style delay) */}
              <div className="space-y-2.5">
                {currentQ.options.map((optionText, optIdx) => {
                  const optionLetters = ['A', 'B', 'C', 'D'];
                  const isSelected = userSelection === optIdx;

                  const buttonStyle = isSelected
                    ? 'bg-[#FAF5FF] dark:bg-[#2A1247] border-2 border-[#7C3AED] dark:border-[#A78BFA] text-[#7C3AED] dark:text-[#A78BFA] shadow-xs'
                    : 'bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] text-[#2E1065] dark:text-[#F5F0FF] hover:border-[#7C3AED]/40 hover:bg-[#FAF5FF] dark:hover:bg-[#2A1247]';

                  const badgeStyle = isSelected
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                    : 'bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] border-[#DDD6FE] dark:border-[#3B2063]';

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      data-testid={`quiz-option-${optIdx}`}
                      onClick={() => handleSelectAnswer(optIdx)}
                      className={`w-full min-h-[50px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border shrink-0 ${badgeStyle}`}
                        >
                          {optionLetters[optIdx] || optIdx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold leading-snug">
                          {optionText}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#7C3AED] dark:bg-[#A78BFA] text-white flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white dark:bg-[#1B0B2E]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-6 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[50px] px-5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>{texts.tests.skip}</span>
            </button>
            <button
              type="button"
              data-testid="quiz-next-cta"
              onClick={handleNext}
              className="flex-1 min-h-[50px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLastQuestion ? texts.tests.finish : texts.tests.next}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 shadow-2xl border border-[#EDE9FE] dark:border-[#3B2063] animate-zoom-in text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h3 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF]">
              {texts.tests.exitConfirm}
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="min-h-[44px] rounded-2xl bg-white dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] text-[#2E1065] dark:text-[#F5F0FF] text-xs font-black cursor-pointer hover:bg-[#FAF5FF]"
              >
                {texts.tests.cancel}
              </button>
              <button
                type="button"
                onClick={() => router.push('/tests')}
                className="min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-md shadow-rose-500/25 cursor-pointer"
              >
                {texts.tests.exit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestRunnerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618] min-h-screen">
          <div className="w-12 h-12 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-4" />
          <p className="text-sm font-black text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.states.loading}
          </p>
        </div>
      }
    >
      <TestRunnerContent />
    </Suspense>
  );
}
