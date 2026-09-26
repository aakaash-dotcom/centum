'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Question, QuizResult, UserAnswerRecord, TestType } from '@/types';
import { ScoreRing } from '@/components/ScoreRing';
import { normalizeSubject } from '@/app/materials/page';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function normalizeChapter(ch: string): string {
  return String(ch || '')
    .trim()
    .replace(/^(chapter|unit|\u0B85\u0BB2\u0B95\u0BC1)\s*\d+\s*[-–.]?\s*/i, '')
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
  const { medium, saveQuizResult, showToast } = useApp();

  const subjectParam = searchParams.get('subject') || '';
  const chapterParam = searchParams.get('chapter') || '';
  const typeParam = (searchParams.get('type') || '') as TestType;
  const standardParam = searchParams.get('standard') || '';
  const countParam = searchParams.get('count') || '';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load and filter questions matching the exact URL contract
  const loadAndFilterQuestions = (shuffle = true) => {
    setIsLoading(true);
    setIsError(false);

    fetch(`/api/questions?medium=${medium}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('questions fetch failed');
        return res.json();
      })
      .then((data) => {
        const pool: Question[] = data && Array.isArray(data.questions) ? data.questions : [];

        // If accessed directly without params, trigger graceful empty state
        if (!subjectParam && !chapterParam) {
          setQuestions([]);
          setIsLoading(false);
          return;
        }

        const normSubjParam = subjectParam.toLowerCase();
        const normStdParam = standardParam.replace(/th/gi, '').trim().toLowerCase();

        const matched = pool.filter((q) => {
          // 1. Subject mapper
          const qSubj = normalizeSubject(q.subject || '').toLowerCase();
          const matchSubj = !subjectParam || qSubj === normSubjParam;

          // 2. Chapter match: exact or normalized prefix stripped
          const qChap = String(q.chapter || '').trim().toLowerCase();
          const targetChap = chapterParam.trim().toLowerCase();
          const matchChap =
            !chapterParam ||
            qChap === targetChap ||
            normalizeChapter(q.chapter) === normalizeChapter(chapterParam);

          // 3. Class level: "10th" vs "10"
          const qStd = String(q.classLevel || '').replace(/th/gi, '').trim().toLowerCase();
          const matchStd = !standardParam || qStd === normStdParam;

          // 4. Type match if present
          const qType = String(q.type || '').trim().toLowerCase();
          const matchType = !typeParam || qType === typeParam.toLowerCase();

          return matchSubj && matchChap && matchStd && matchType;
        });

        const shuffled = shuffle ? [...matched].sort(() => Math.random() - 0.5) : matched;
        const parsedCount = parseInt(countParam, 10);
        const finalCount = parsedCount > 0 ? parsedCount : shuffled.length > 0 ? shuffled.length : 10;
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
  }, [medium, subjectParam, chapterParam, typeParam, standardParam, countParam]);

  // Live timer countdown
  useEffect(() => {
    if (isLoading || isFinished || questions.length === 0) return;

    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLoading, isFinished, questions.length]);

  const recordTimeForCurrentQuestion = () => {
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setQuestionTimes((prev) => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + elapsed,
    }));
    questionStartTimeRef.current = Date.now();
  };

  const handleSelectAnswer = (optionIndex: number) => {
    // Only allow selection once per question for instant feedback
    if (selectedAnswers[currentIndex] !== undefined) return;

    recordTimeForCurrentQuestion();
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

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

    const firstQ = questions[0];
    const quizResult: QuizResult = {
      testId: `tr_${standardParam || '10th'}_${subjectParam || 'Maths'}_${chapterParam || 'General'}_${typeParam || 'oneword'}`,
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

  const handleRetake = () => {
    setIsFinished(false);
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
      [idx]: !prev[idx],
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

  // Error State
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
  const hasAnswered = userSelection !== undefined;
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

        {/* Question Review Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA]">
              {texts.tests.questionsReview} ({correctCount}/{totalCount})
            </h3>
          </div>

          {questions.map((q, idx) => {
            const userPick = selectedAnswers[idx];
            const isCorrect = userPick === q.answerIndex;
            const isSkipped = userPick === undefined || userPick === -1;
            const isExpanded = expandedReviews[idx] ?? false;

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
                      {q.options.map((opt, optIdx) => {
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

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] text-[11px] font-medium text-[#2E1065]/90 dark:text-[#F5F0FF]/90 mt-2">
                        <span className="font-black text-[#7C3AED] dark:text-[#A78BFA] block mb-0.5">
                          💡 {texts.tests.explanation}:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063] inline-block mb-2">
              {texts.tests.questionProgress} {currentIndex + 1}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-[#2E1065] dark:text-[#F5F0FF] leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* 4 Options Grid with Instant Green/Red Feedback */}
          <div className="space-y-2.5">
            {currentQ.options.map((optionText, optIdx) => {
              const optionLetters = ['A', 'B', 'C', 'D'];
              const isSelected = userSelection === optIdx;
              const isCorrectAnswer = optIdx === currentQ.answerIndex;

              let buttonStyle =
                'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] text-[#2E1065] dark:text-[#F5F0FF] hover:border-[#7C3AED]/40 hover:bg-[#FAF5FF] dark:hover:bg-[#2A1247]';
              let badgeStyle =
                'bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] border-[#DDD6FE] dark:border-[#3B2063]';

              if (hasAnswered) {
                if (isSelected && isCorrectAnswer) {
                  // User chose correct
                  buttonStyle =
                    'bg-[#A3E635]/20 border-2 border-[#84CC16] text-[#14532D] dark:text-[#A3E635] shadow-xs';
                  badgeStyle = 'bg-[#84CC16] text-white border-[#84CC16]';
                } else if (isSelected && !isCorrectAnswer) {
                  // User chose wrong
                  buttonStyle =
                    'bg-rose-500/15 border-2 border-rose-500 text-rose-800 dark:text-rose-200 shadow-xs';
                  badgeStyle = 'bg-rose-500 text-white border-rose-500';
                } else if (!isSelected && isCorrectAnswer) {
                  // Reveal correct answer
                  buttonStyle =
                    'bg-[#A3E635]/10 border-2 border-[#A3E635] text-[#14532D] dark:text-[#A3E635]';
                  badgeStyle = 'bg-[#A3E635] text-[#18181B] border-[#A3E635]';
                } else {
                  // Other unselected options
                  buttonStyle =
                    'bg-white/60 dark:bg-[#1B0B2E]/60 border-transparent text-[#2E1065]/40 dark:text-[#F5F0FF]/40 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full min-h-[50px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer disabled:cursor-default ${buttonStyle}`}
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

                  {hasAnswered && isSelected && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-[#84CC16] shrink-0 stroke-[2.5]" />
                  )}
                  {hasAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 stroke-[2.5]" />
                  )}
                  {hasAnswered && !isSelected && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-[#84CC16] shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Explanation Box (Revealed after answering) */}
          {hasAnswered && currentQ.explanation && (
            <div className="bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl p-4 border border-[#DDD6FE] dark:border-[#3B2063] animate-fade-in text-xs">
              <span className="font-black text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
                💡 {texts.tests.explanation}:
              </span>
              <p className="font-semibold text-[#2E1065]/90 dark:text-[#F5F0FF]/90 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-6 pb-2">
          {!hasAnswered ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="w-full min-h-[50px] rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{texts.tests.skip}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full min-h-[50px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLastQuestion ? texts.tests.finish : texts.tests.next}</span>
            </button>
          )}
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
