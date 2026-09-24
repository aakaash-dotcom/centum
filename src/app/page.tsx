'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MediumToggle } from '@/components/MediumToggle';
import { StreakChip } from '@/components/StreakChip';
import { DailyQuizBox } from '@/components/DailyQuizBox';
import { LeaderboardBox } from '@/components/LeaderboardBox';
import { texts } from '@/data/texts';
import { ArrowRight, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface ClassBoxConfig {
  level: string;
  emoji: string;
  isAvailable: boolean;
  tag?: string;
}

const CLASSES: ClassBoxConfig[] = [
  { level: '6th', emoji: '🐣', isAvailable: false },
  { level: '7th', emoji: '⚡', isAvailable: false },
  { level: '8th', emoji: '🚀', isAvailable: false },
  { level: '9th', emoji: '🔮', isAvailable: false },
  { level: '10th', emoji: '🎯', isAvailable: true, tag: 'SSLC' },
  { level: '11th', emoji: '💎', isAvailable: false },
  { level: '12th', emoji: '👑', isAvailable: true, tag: 'HSC' },
];

const CATEGORIES = [
  { id: 'pyq', label: texts.categories.pyq },
  { id: 'model', label: texts.categories.model },
  { id: 'important', label: texts.categories.important },
  { id: 'book', label: texts.categories.book },
];

export default function HomePage() {
  const { student, isRegistered, showToast } = useApp();
  const [showOtherClasses, setShowOtherClasses] = useState(false);

  const handleUnavailableClick = () => {
    showToast(texts.classes.cookingToast);
  };

  const userStandard = student?.standard || '10th';
  const userStream = student?.stream;
  const isAvailableStandard = userStandard === '10th' || userStandard === '12th';
  const targetClass = isAvailableStandard ? userStandard : '10th';

  // REGISTERED STUDENT HOME SCREEN
  if (isRegistered && student) {
    return (
      <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-4 animate-fade-in">
        {/* 1. Greeting Card: Name + Standard Chip + Stream Chip */}
        <div className="w-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-3xl p-5 shadow-lg shadow-[#7C3AED]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#E9D5FF] uppercase tracking-wider">
                welcome back
              </p>
              <h1 className="text-xl font-black tracking-tight">
                {texts.profile.greeting} {student.name} 👋
              </h1>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[#A3E635] text-xs font-black shadow-xs">
                {student.standard}
              </span>
              {student.stream && (
                <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white text-[10px] font-extrabold max-w-[140px] truncate">
                  {student.stream}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Streak Chip 🔥 */}
        <StreakChip />

        {/* 3. Quiz of the Day 🎯 (ONLY rendered if quiz object returned; completely invisible if null) */}
        <DailyQuizBox />

        {/* 4. Leaderboard 🏆 Box (Top 5 + You row) */}
        <LeaderboardBox />

        {/* 5. Their Categories (PYQ, Model, Important, Books) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-black text-[#2E1065] tracking-tight">
              {targetClass} prep
            </h2>
            {student.stream && (
              <span className="text-[11px] font-bold text-[#7C3AED] truncate max-w-[160px]">
                {student.stream}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/class/${targetClass}?category=${cat.id}`}
                className="min-h-[64px] p-3.5 rounded-2xl bg-white hover:bg-[#FAF5FF] border border-[#EDE9FE] hover:border-[#7C3AED]/40 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="font-extrabold text-xs text-[#2E1065] leading-snug">
                  {cat.label}
                </span>
                <ArrowRight className="w-4 h-4 text-[#7C3AED] group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* 6. Demoted "explore other classes" link at bottom */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowOtherClasses((prev) => !prev)}
            className="text-xs font-black text-[#7C3AED] hover:text-[#5B21B6] underline transition-colors cursor-pointer py-2"
          >
            {showOtherClasses ? texts.home.backToMyHome : texts.home.exploreOtherClasses}
          </button>

          {showOtherClasses && (
            <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#EDE9FE] animate-slide-up text-left">
              {CLASSES.map((cls) => (
                <div key={cls.level}>
                  {cls.isAvailable ? (
                    <Link
                      href={`/class/${cls.level}`}
                      className="p-3 bg-white rounded-2xl border border-[#EDE9FE] shadow-xs flex items-center justify-between text-xs font-black text-[#2E1065] hover:bg-[#FAF5FF]"
                    >
                      <span>{cls.level} {cls.emoji}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#7C3AED]" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUnavailableClick}
                      className="w-full p-3 bg-white/70 rounded-2xl border border-[#EDE9FE] flex items-center justify-between text-xs font-bold text-[#6D28D9]/60 cursor-pointer"
                    >
                      <span>{cls.level} {cls.emoji}</span>
                      <span className="text-[10px] bg-[#FAF5FF] px-1.5 py-0.5 rounded text-[#7C3AED]">soon 👀</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // GUEST HOME SCREEN (Class Picker)
  return (
    <div className="flex-1 flex flex-col px-4 pt-6 pb-6">
      {/* Top Section: Medium Toggle */}
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EDE9FE] shadow-xs">
          <span className="text-sm font-black tracking-tight text-[#7C3AED]">
            {texts.app.name}
          </span>
          <span className="text-xs">💯</span>
        </div>

        {/* Big Thumb-Friendly Medium Toggle */}
        <MediumToggle />
      </div>

      {/* 7 Class Boxes in a thumb-friendly grid */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3.5">
          {CLASSES.map((cls) => {
            if (cls.isAvailable) {
              return (
                <Link
                  key={cls.level}
                  href={`/class/${cls.level}`}
                  className="min-h-[110px] bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white rounded-2xl p-4 shadow-md shadow-[#7C3AED]/25 flex flex-col justify-between transition-all cursor-pointer border border-[#8B5CF6]/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cls.emoji}</span>
                    {cls.tag && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-[#A3E635]">
                        {cls.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black tracking-tight">
                      {cls.level}
                    </span>
                    <ArrowRight className="w-5 h-5 text-[#A3E635]" />
                  </div>
                </Link>
              );
            }

            // Inactive class box ("soon 👀", fires toast on tap)
            return (
              <button
                key={cls.level}
                type="button"
                onClick={handleUnavailableClick}
                className="min-h-[110px] bg-white hover:bg-[#F3E8FF]/30 active:scale-[0.98] rounded-2xl p-4 border border-[#EDE9FE] shadow-xs flex flex-col justify-between transition-all cursor-pointer text-left opacity-75"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl opacity-60">{cls.emoji}</span>
                  <span className="text-[10px] font-extrabold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-full">
                    {texts.classes.soonBadge}
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#6D28D9]/70">
                    {cls.level}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
