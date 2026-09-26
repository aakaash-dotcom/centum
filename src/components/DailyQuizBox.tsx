'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { normalizeSubject } from '@/app/materials/page';

interface ScheduledQuiz {
  date: string;
  classLevel: string;
  medium: string;
  subject: string;
  chapter: string;
  type: string;
  count: number;
}

export const DailyQuizBox: React.FC = () => {
  const { student, isRegistered, medium, guestStandard, quizResults } = useApp();
  const [quiz, setQuiz] = useState<ScheduledQuiz | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);

  const viewerClass = isRegistered && student?.standard ? student.standard : guestStandard || '10th';

  useEffect(() => {
    let isMounted = true;

    // Current date in IST (Indian Standard Time YYYY-MM-DD)
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    const url = `/api/today-quiz?classLevel=${encodeURIComponent(viewerClass)}&medium=${encodeURIComponent(medium)}&date=${encodeURIComponent(todayIST)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Schedule fetch failed');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data && data.ok && data.quiz) {
            const q: ScheduledQuiz = data.quiz;
            setQuiz(q);

            // Check if completed today
            try {
              const key1 = `centum_today_quiz_completed_sch_${q.date}`;
              const key2 = `centum_today_quiz_completed_${q.date}_${q.classLevel}_${q.subject}_${q.chapter}`;
              const fromStorage =
                localStorage.getItem(key1) === 'true' ||
                localStorage.getItem(key2) === 'true' ||
                localStorage.getItem(`centum_today_quiz_completed_${q.date}`) === 'true';

              const fromResults =
                Array.isArray(quizResults) &&
                quizResults.some(
                  (r) =>
                    r.testId === `sch_${q.date}` ||
                    (r.testId && r.testId.startsWith(`sch_${q.date}`)) ||
                    (normalizeSubject(r.subject).toLowerCase() === normalizeSubject(q.subject).toLowerCase() &&
                      r.completedAt &&
                      r.completedAt.startsWith(q.date))
                );

              setIsCompletedToday(Boolean(fromStorage || fromResults));
            } catch (e) {
              setIsCompletedToday(false);
            }
          } else {
            setQuiz(null);
          }
          setIsFetched(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Safety: hide silently on error / unknown action
          setQuiz(null);
          setIsFetched(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [viewerClass, medium, quizResults]);

  // Card hidden if not fetched yet, or quiz === null (no skeleton loop, no error state)
  if (!isFetched || !quiz) {
    return null;
  }

  const mappedSubject = normalizeSubject(quiz.subject);
  const testRunnerHref = `/test-runner?${new URLSearchParams({
    subject: mappedSubject,
    chapter: quiz.chapter,
    type: quiz.type || 'oneword',
    standard: quiz.classLevel,
    count: String(quiz.count || 10),
    quizId: `sch_${quiz.date}`,
  }).toString()}`;

  // Completed State for Today
  if (isCompletedToday) {
    return (
      <div className="w-full p-[2px] rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A3E635] shadow-lg shadow-[#7C3AED]/10 animate-fade-in">
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-[22px] p-5 text-[#2E1065] dark:text-[#F5F0FF] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#F3E8FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA]">
                <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              </span>
              <span className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-wider">
                {texts.tests.todaysQuiz || "Today's Quiz"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A3E635]/20 text-[#14532D] dark:text-[#A3E635] text-[11px] font-black border border-[#84CC16]/30">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{texts.tests.completedForToday || 'completed for today ✅'}</span>
            </span>
          </div>

          <div className="pt-1">
            <h3 className="text-sm sm:text-base font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
              {quiz.subject} · {quiz.chapter}
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-0.5">
              {quiz.count} {quiz.type === 'concept' ? texts.tests.concept : texts.tests.oneword} · {texts.home.streakSafe || 'Streak safe 🔥'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Scheduled Quiz Card
  return (
    <div className="w-full p-[2px] rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#F472B6] to-[#A3E635] shadow-lg shadow-[#7C3AED]/15 animate-fade-in">
      <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-[22px] p-5 text-[#2E1065] dark:text-[#F5F0FF] transition-colors">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F3E8FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA]">
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            </span>
            <span className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-wider">
              {texts.tests.todaysQuiz || "Today's Quiz ⚡"}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063] text-[10px] font-black uppercase">
            {quiz.classLevel}
          </span>
        </div>

        {/* Portion Details */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
            {quiz.subject}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA] mt-0.5 leading-snug">
            {quiz.chapter}
          </p>
          <div className="inline-flex items-center gap-2 mt-2.5">
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#A3E635] text-[#18181B] shadow-2xs">
              {quiz.count} Qs
            </span>
            <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
              {quiz.type === 'concept' ? texts.tests.concept : texts.tests.oneword}
            </span>
          </div>
        </div>

        {/* Action CTA */}
        <Link
          href={testRunnerHref}
          className="w-full min-h-[48px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-black text-sm shadow-md shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>{texts.tests.startScheduledQuiz || texts.tests.startConfirmCta || 'start test →'}</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </Link>
      </div>
    </div>
  );
};
