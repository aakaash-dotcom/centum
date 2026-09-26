'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Question, QuizResult, UserAnswerRecord } from '@/types';
import { ScoreRing } from '@/components/ScoreRing';
import { ArrowLeft, Clock, CheckCircle2, XCircle, RotateCcw, Award, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ChapterTestRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const rawTestId = decodeURIComponent((params?.testId as string) || '');

  const { isRegistered, openGate, medium, saveQuizResult, showToast } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load and filter questions matching the chapter key
  const loadAndFilterQuestions = (shuffle = false) => {
    setIsLoading(true);
    setIsError(false);
    fetch(`/api/questions?medium=${medium}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('questions fetch failed');
        return res.json();
      })
      .then((data) => {
        let pool: Question[] = [];
        if (data && data.questions && Array.isArray(data.questions)) {
          pool = data.questions;
        }

        // Match by composite key: {classLevel}_{subject}_{chapter}_{type}
        const parts = rawTestId.split('_');
        let matched: Question[] = [];
        if (parts.length >= 4) {
          const [cls, subj, ch, tp] = parts;
          matched = pool.filter(
            (q) => {
              const c = String(q.classLevel || '').trim().toLowerCase();
              const target = cls.toLowerCase();
              const matchClass = c === target || (target === '10th' && c === '10') || (target === '12th' && c === '12');
              const qSubj = String(q.subject || '').trim().toLowerCase();
              const qChapter = String(q.chapter || '').trim().toLowerCase();
              const qType = String(q.type || '').trim().toLowerCase();
              const qMedium = String(q.medium || '').trim().toLowerCase();

              return (
                matchClass &&
                qSubj === subj.toLowerCase() &&
                (ch.toLowerCase() === 'all' || qChapter === ch.toLowerCase()) &&
                (tp.toLowerCase() === 'pro' || qType === tp.toLowerCase()) &&
                qMedium === String(medium || '').trim().toLowerCase()
              );
            }
          );
        }

        // Fallback: match by medium and class
        if (matched.length === 0) {
          matched = pool.filter(
            (q) => String(q.medium || '').trim().toLowerCase() === String(medium || '').trim().toLowerCase()
          );
        }

        if (shuffle) {
          matched = [...matched].sort(() => Math.random() - 0.5);
        }

        setQuestions(matched);
        setSecondsRemaining(Math.max(matched.length * 60, 120));
        setIsLoading(false);
        questionStartTimeRef.current = Date.now();
      })
      .catch(() => {
        setIsError(true);
        setQuestions([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!isRegistered) {
      openGate(() => {
        loadAndFilterQuestions();
      });
    } else {
      loadAndFilterQuestions();
    }
  }, [rawTestId, medium, isRegistered]);

  // Countdown timer
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

  const handleSelectOption = (optionIndex: number) => {
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
      } catch (e) {}
    }

    const firstQ = questions[0];
    const quizResult: QuizResult = {
      testId: rawTestId,
      title: firstQ ? `${firstQ.subject} - ${firstQ.chapter}` : 'Chapter Test',
      classLevel: firstQ?.classLevel || '10th',
      subject: firstQ?.subject || 'Maths',
      chapter: firstQ?.chapter || 'Chapter',
      type: firstQ?.type || 'oneword',
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
    loadAndFilterQuestions(true);
    showToast('test shuffled! 🔀');
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B0F6E] border-t-[#7C3AED] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#7C3AED] dark:text-[#A3E635]">{texts.states.loading}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-3">👻</span>
        <p className="text-base font-bold text-[#2E1065] dark:text-[#FAF5FF] mb-3">
          {texts.states.signalGhost}
        </p>
        <button
          type="button"
          onClick={() => loadAndFilterQuestions()}
          className="min-h-[44px] px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
        >
          retry 🔄
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-2">🐶</span>
        <p className="text-base font-bold text-[#2E1065] dark:text-[#FAF5FF]">{texts.states.empty}</p>
        <Link
          href="/tests"
          className="mt-4 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-bold"
        >
          back to tests
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const userSelection = selectedAnswers[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // RESULTS SCREEN
  if (isFinished) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answerIndex) correctCount += 1;
    });
    const totalCount = questions.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    return (
      <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/tests"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#3B0F6E] border border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <span className="text-sm font-black text-[#7C3AED] dark:text-[#A3E635] bg-[#F3E8FF] dark:bg-[#3B0F6E] px-3 py-1 rounded-full border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
            {accuracy === 100 ? texts.tests.perfectScore : accuracy >= 70 ? texts.tests.goodScore : texts.tests.practiceMore}
          </span>
        </div>

        {/* Big Score Ring Card */}
        <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-lg shadow-[#7C3AED]/5 flex flex-col items-center justify-center text-center mb-5">
          <ScoreRing score={correctCount} total={totalCount} accuracy={accuracy} />

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#FAF5FF] dark:border-[#230542]">
            <div className="p-3 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl">
              <span className="block text-[11px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A3E635]">
                {texts.tests.accuracy}
              </span>
              <span className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {Math.round(accuracy)}%
              </span>
            </div>

            <div className="p-3 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl">
              <span className="block text-[11px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A3E635]">
                Avg per Question
              </span>
              <span className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {Math.round(
                  Object.values(questionTimes).reduce((a, b) => a + b, 0) / (totalCount || 1)
                )}s
              </span>
            </div>
          </div>

          {/* Big Retake Button (Shuffled!) */}
          <button
            type="button"
            onClick={handleRetake}
            className="w-full min-h-[50px] mt-4 flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>{texts.tests.retake}</span>
          </button>
        </div>

        {/* Question Review Section */}
        <div className="mb-2">
          <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight mb-3">
            {texts.tests.review} ({questions.length})
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const selected = selectedAnswers[idx];
              const isCorrect = selected === q.answerIndex;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-[#3B0F6E] rounded-2xl p-4 border transition-all ${
                    isCorrect
                      ? 'border-[#86EFAC] dark:border-[#86EFAC]/40 shadow-xs'
                      : 'border-[#FECDD3] dark:border-[#FECDD3]/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-[#7C3AED] dark:text-[#A3E635] bg-[#F3E8FF] dark:bg-[#230542] px-2 py-0.5 rounded-md">
                      Q{idx + 1}
                    </span>
                    {isCorrect ? (
                      <span className="text-xs font-black text-[#16A34A] dark:text-[#4ADE80] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {texts.tests.correct}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-[#E11D48] dark:text-[#FB7185] flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {texts.tests.wrong}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] mb-3">
                    {q.question}
                  </p>

                  <div className="space-y-1.5 text-xs font-bold mb-3">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.answerIndex;
                      const isOptionSelected = optIdx === selected;

                      let optClass = 'bg-[#FAF5FF] dark:bg-[#230542] border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-[#2E1065] dark:text-[#FAF5FF]';
                      if (isOptionCorrect) {
                        optClass = 'bg-[#F0FDF4] dark:bg-[#14532D]/40 border-[#86EFAC] dark:border-[#86EFAC]/40 text-[#166534] dark:text-[#86EFAC] font-black';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        optClass = 'bg-[#FFF1F2] dark:bg-[#881337]/40 border-[#FDA4AF] dark:border-[#FDA4AF]/40 text-[#9F1239] dark:text-[#FDA4AF] line-through';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${optClass}`}
                        >
                          <span>{opt}</span>
                          {isOptionCorrect && <span>✓ correct</span>}
                          {isOptionSelected && !isOptionCorrect && <span>✗ chosen</span>}
                        </div>
                      );
                    })}
                  </div>

                  {Boolean(q.explanation && String(q.explanation).trim()) && (
                    <div className="p-2.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-xs font-semibold text-[#5B21B6] dark:text-[#DDD6FE]">
                      <span className="font-black uppercase tracking-wider block mb-0.5 text-[10px] text-[#7C3AED] dark:text-[#A3E635]">
                        {texts.tests.explanation}:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE TEST TAKING SCREEN
  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 animate-fade-in">
      {/* Top Countdown Timer & Progress HUD */}
      <div className="flex items-center justify-between gap-3 mb-4 bg-white dark:bg-[#3B0F6E] p-3 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
        <Link
          href="/tests"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </Link>

        {/* Question Counter Pill */}
        <div className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
          <span className="text-[#7C3AED] dark:text-[#A3E635]">Q {currentIndex + 1}</span>
          <span className="text-[#6D28D9]/50 dark:text-[#DDD6FE]/50"> / {questions.length}</span>
        </div>

        {/* Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black ${
            secondsRemaining < 60
              ? 'bg-[#FEE2E2] dark:bg-[#991B1B] text-[#DC2626] dark:text-[#FCA5A5] animate-pulse'
              : 'bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full h-1.5 bg-[#EDE9FE] dark:bg-[#3B0F6E] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#7C3AED] transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-md shadow-[#7C3AED]/5">
          <span className="inline-block text-[11px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] bg-[#F3E8FF] dark:bg-[#230542] px-2.5 py-0.5 rounded-full mb-3">
            {currentQ.subject} · {currentQ.type === 'oneword' ? 'One Word' : 'Concept Quiz'}
          </span>

          <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#FAF5FF] leading-relaxed mb-6">
            {currentQ.question}
          </h2>

          {/* 4 Options Buttons (>= 48px touch targets) */}
          <div className="space-y-3">
            {currentQ.options.map((opt, optIndex) => {
              const isSelected = userSelection === optIndex;
              return (
                <button
                  key={optIndex}
                  type="button"
                  onClick={() => handleSelectOption(optIndex)}
                  className={`w-full min-h-[50px] p-3.5 rounded-2xl text-left font-bold text-sm transition-all cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-[1.01]'
                      : 'bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] text-[#2E1065] dark:text-[#FAF5FF] border-[#DDD6FE] dark:border-[#DDD6FE]/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-white dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#A3E635] text-[#18181B] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Next / Finish CTA */}
        <div className="pt-5">
          <button
            type="button"
            onClick={handleNext}
            disabled={userSelection === undefined}
            className={`w-full min-h-[52px] flex items-center justify-center gap-2 font-black text-base rounded-2xl transition-all cursor-pointer ${
              userSelection !== undefined
                ? 'bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] shadow-lg shadow-[#A3E635]/25 active:scale-[0.98]'
                : 'bg-[#E2E8F0] dark:bg-[#230542] text-[#94A3B8] dark:text-[#64748B] cursor-not-allowed border dark:border-[#DDD6FE]/10'
            }`}
          >
            <span>{isLastQuestion ? texts.tests.finish : texts.tests.next}</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
