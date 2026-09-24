'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { DailyQuiz, QuizResult } from '@/types';
import { Target, CheckCircle2, XCircle, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DailyQuizBox: React.FC = () => {
  const { student, medium, saveQuizResult, showToast } = useApp();
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  const studentStandard = student?.standard || '10th';
  const studentStream = student?.stream || '';

  useEffect(() => {
    let isMounted = true;

    const url = `/api/dailyquiz?classLevel=${encodeURIComponent(studentStandard)}&stream=${encodeURIComponent(studentStream)}&medium=${medium}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.quiz) {
            setQuiz(data.quiz);

            try {
              const answeredKey = `centum_daily_${data.quiz.id}_${new Date().toDateString()}`;
              const saved = localStorage.getItem(answeredKey);
              if (saved !== null) {
                setSelectedOption(parseInt(saved, 10));
                setHasAnswered(true);
              }
            } catch (e) {}
          } else {
            setQuiz(null);
          }
          setIsFetched(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQuiz(null);
          setIsFetched(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentStandard, studentStream, medium]);

  if (!isFetched || !quiz) {
    return null;
  }

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;

    setSelectedOption(index);
    setHasAnswered(true);

    const isCorrect = index === quiz.answerIndex;

    if (isCorrect) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#A3E635', '#7C3AED', '#F472B6'],
        });
      } catch (e) {}
    }

    try {
      const answeredKey = `centum_daily_${quiz.id}_${new Date().toDateString()}`;
      localStorage.setItem(answeredKey, String(index));
    } catch (e) {}

    const result: QuizResult = {
      testId: `daily_${quiz.id}`,
      title: `${texts.home.dailyQuizTitle} - ${quiz.subject}`,
      classLevel: quiz.classLevel,
      subject: quiz.subject,
      chapter: quiz.chapter || 'Daily Quiz',
      type: 'daily',
      score: isCorrect ? 1 : 0,
      total: 1,
      accuracy: isCorrect ? 100 : 0,
      totalTimeSeconds: 15,
      answers: [
        {
          questionId: quiz.id,
          selectedIndex: index,
          isCorrect,
          timeSpentSeconds: 15,
        },
      ],
      completedAt: new Date().toISOString(),
    };

    saveQuizResult(result);
    showToast(texts.home.streakSafe);
  };

  const isUserCorrect = selectedOption === quiz.answerIndex;

  return (
    <div className="w-full p-[2px] rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#F472B6] to-[#A3E635] shadow-lg shadow-[#7C3AED]/10 animate-fade-in">
      <div className="w-full bg-white dark:bg-[#3B0F6E] rounded-[22px] p-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
              {texts.home.dailyQuizTitle}
            </h2>
          </div>

          {hasAnswered ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] flex items-center gap-1 shadow-xs">
              <Flame className="w-3 h-3 text-[#18181B]" />
              {texts.home.streakSafe}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635]">
              {quiz.subject}
            </span>
          )}
        </div>

        {/* Question */}
        <p className="text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] leading-snug mb-4">
          {quiz.question}
        </p>

        {/* 4 Options */}
        <div className="space-y-2">
          {quiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === quiz.answerIndex;

            let btnClass = 'bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] text-[#2E1065] dark:text-[#FAF5FF] border-[#EDE9FE] dark:border-[#DDD6FE]/20';

            if (hasAnswered) {
              if (isCorrect) {
                btnClass = 'bg-[#F0FDF4] dark:bg-[#14532D]/40 border-[#86EFAC] dark:border-[#86EFAC]/40 text-[#166534] dark:text-[#86EFAC] font-black';
              } else if (isSelected && !isCorrect) {
                btnClass = 'bg-[#FFF1F2] dark:bg-[#881337]/40 border-[#FDA4AF] dark:border-[#FDA4AF]/40 text-[#9F1239] dark:text-[#FDA4AF] line-through';
              } else {
                btnClass = 'bg-white dark:bg-[#230542] opacity-40 border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-[#2E1065] dark:text-[#FAF5FF]';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full min-h-[44px] p-3 rounded-2xl text-left text-xs font-bold transition-all border flex items-center justify-between ${btnClass} ${
                  hasAnswered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center justify-center text-[10px] font-black text-[#7C3AED] dark:text-[#A3E635]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {hasAnswered && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                )}
                {hasAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-[#E11D48] dark:text-[#FB7185] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation upon answering */}
        {hasAnswered && quiz.explanation && (
          <div className="mt-3.5 p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-xs font-semibold text-[#5B21B6] dark:text-[#DDD6FE] animate-slide-up">
            <div className="flex items-center gap-1.5 mb-1">
              {isUserCorrect ? (
                <span className="text-[11px] font-black text-[#16A34A] dark:text-[#4ADE80] uppercase tracking-wide">
                  {texts.tests.correct}
                </span>
              ) : (
                <span className="text-[11px] font-black text-[#E11D48] dark:text-[#FB7185] uppercase tracking-wide">
                  {texts.tests.wrong}
                </span>
              )}
            </div>
            <p className="leading-relaxed">{quiz.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
