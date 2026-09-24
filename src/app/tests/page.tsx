'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TestType, Question } from '@/types';
import { SAMPLE_QUESTIONS } from '@/data/sampleData';
import { MediumToggle } from '@/components/MediumToggle';
import { Brain, BookOpen, Clock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface ChapterGroup {
  id: string;
  classLevel: string;
  subject: string;
  chapter: string;
  type: TestType;
  questionCount: number;
}

export default function TestsHomePage() {
  const router = useRouter();
  const { medium, isRegistered, openGate, student } = useApp();

  const [selectedType, setSelectedType] = useState<TestType>('oneword');
  const [selectedClass, setSelectedClass] = useState<string>(student?.standard === '12th' ? '12th' : '10th');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch questions from API or fallback
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

  // Aggregate questions into distinct chapter test groups
  const chapterGroups: ChapterGroup[] = React.useMemo(() => {
    const map = new Map<string, ChapterGroup>();

    questions
      .filter((q) => q.medium === medium)
      .forEach((q) => {
        const key = `${q.classLevel}_${q.subject}_${q.chapter}_${q.type}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            classLevel: q.classLevel,
            subject: q.subject,
            chapter: q.chapter,
            type: q.type,
            questionCount: 1,
          });
        } else {
          const item = map.get(key)!;
          item.questionCount += 1;
        }
      });

    return Array.from(map.values());
  }, [questions, medium]);

  const filteredChapters = chapterGroups.filter(
    (g) =>
      g.type === selectedType &&
      g.classLevel.toLowerCase() === selectedClass.toLowerCase()
  );

  const handleTestClick = (chapterKey: string) => {
    const encodedId = encodeURIComponent(chapterKey);
    const testUrl = `/tests/${encodedId}`;

    if (!isRegistered) {
      // Guest: gate bottom sheet trips!
      openGate(() => {
        router.push(testUrl);
      });
      return;
    }

    // Registered: plays immediately!
    router.push(testUrl);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2E1065] tracking-tight">
            {texts.nav.tests} 🎯
          </h1>
          <p className="text-xs font-bold text-[#7C3AED]">
            {selectedClass} mock tests
          </p>
        </div>

        <MediumToggle compact />
      </div>

      {/* 2 Big Test Type Boxes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setSelectedType('oneword')}
          className={`min-h-[72px] p-3.5 rounded-2xl text-left font-black text-sm tracking-tight transition-all cursor-pointer flex flex-col justify-between border ${
            selectedType === 'oneword'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 border-[#7C3AED] scale-[1.02]'
              : 'bg-white text-[#2E1065] hover:bg-[#FAF5FF] border-[#EDE9FE] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <BookOpen className="w-5 h-5 opacity-90" />
            {selectedType === 'oneword' && (
              <Sparkles className="w-4 h-4 text-[#A3E635]" />
            )}
          </div>
          <span>{texts.testTypes.oneword}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('concept')}
          className={`min-h-[72px] p-3.5 rounded-2xl text-left font-black text-sm tracking-tight transition-all cursor-pointer flex flex-col justify-between border ${
            selectedType === 'concept'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 border-[#7C3AED] scale-[1.02]'
              : 'bg-white text-[#2E1065] hover:bg-[#FAF5FF] border-[#EDE9FE] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <Brain className="w-5 h-5 opacity-90" />
            {selectedType === 'concept' && (
              <Sparkles className="w-4 h-4 text-[#A3E635]" />
            )}
          </div>
          <span>{texts.testTypes.concept}</span>
        </button>
      </div>

      {/* Class Level Selector Tabs (10th & 12th) */}
      <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-2xl border border-[#EDE9FE]">
        {['10th', '12th'].map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => setSelectedClass(cls)}
            className={`flex-1 min-h-[44px] rounded-xl font-black text-xs transition-all cursor-pointer ${
              selectedClass === cls
                ? 'bg-[#2E1065] text-white shadow-xs'
                : 'text-[#6D28D9] hover:bg-[#FAF5FF]'
            }`}
          >
            {cls} Standard
          </button>
        ))}
      </div>

      {/* Chapter List */}
      <div className="flex-1 flex flex-col">
        {filteredChapters.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-2">🐶</span>
            <p className="text-sm font-bold text-[#6D28D9]/75">
              {texts.states.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChapters.map((grp) => (
              <div
                key={grp.id}
                onClick={() => handleTestClick(grp.id)}
                className="w-full bg-white rounded-2xl p-4 border border-[#EDE9FE] hover:border-[#7C3AED]/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-full">
                      {grp.subject}
                    </span>
                    <span className="text-[11px] font-semibold text-[#6D28D9]/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {grp.questionCount * 1} min
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-[#2E1065] leading-snug line-clamp-1">
                    {grp.chapter}
                  </h3>
                  <p className="text-xs font-semibold text-[#6D28D9]/75 mt-0.5">
                    {grp.questionCount} questions ⚡
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#FAF5FF] group-hover:bg-[#7C3AED] group-hover:text-white text-[#7C3AED] flex items-center justify-center transition-colors shrink-0">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
