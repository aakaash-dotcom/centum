'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { StreakChip } from '@/components/StreakChip';
import { DailyQuizBox } from '@/components/DailyQuizBox';
import { LeaderboardBox } from '@/components/LeaderboardBox';
import { PWAInstallChip } from '@/components/PWAInstallChip';
import { texts } from '@/data/texts';
import { ArrowRight, Crown } from 'lucide-react';

interface ClassBoxConfig {
  level: string;
  emoji: string;
  isAvailable: boolean;
  tag?: string;
}

// Reverse class grid order: 12th -> 6th (12th 👑 and 10th 🎯 active, 12th FIRST)
const CLASSES: ClassBoxConfig[] = [
  { level: '12th', emoji: '👑', isAvailable: true, tag: 'HSC' },
  { level: '11th', emoji: '💎', isAvailable: false },
  { level: '10th', emoji: '🎯', isAvailable: true, tag: 'SSLC' },
  { level: '9th', emoji: '🔮', isAvailable: false },
  { level: '8th', emoji: '🚀', isAvailable: false },
  { level: '7th', emoji: '⚡', isAvailable: false },
  { level: '6th', emoji: '🐣', isAvailable: false },
];

export default function HomePage() {
  const { student, isRegistered, showToast, medium, setMedium } = useApp();
  const [isDemoContent, setIsDemoContent] = useState(false);

  useEffect(() => {
    fetch('/api/papers?limit=1')
      .then((res) => {
        const sourceHeader = res.headers.get('x-data-source');
        if (sourceHeader === 'mock') {
          setIsDemoContent(true);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.source === 'mock-fallback') {
          setIsDemoContent(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleUnavailableClick = () => {
    showToast(texts.classes.cookingToast);
  };

  const userStandard = student?.standard || '10th';
  const isAvailableStandard = userStandard === '10th' || userStandard === '12th';
  const targetClass = isAvailableStandard ? userStandard : '10th';

  const categories = [
    { id: 'pyq', label: texts.categories.pyq },
    { id: 'model', label: texts.categories.model },
    { id: 'important', label: texts.categories.important },
    { id: 'book', label: texts.categories.book },
  ];

  // REGISTERED STUDENT HOME SCREEN
  if (isRegistered && student) {
    return (
      <div className="flex-1 flex flex-col px-4 pt-4 pb-12 space-y-4 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
        {/* PWA Add to Home Screen Chip (Android & iOS) */}
        <PWAInstallChip />

        {/* 1. Purple Gradient Greeting Hero (Glow Shadow, Big Name, Lime/Pink Chips) */}
        <div className="w-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#9333EA] text-white rounded-3xl p-5 shadow-xl shadow-[#7C3AED]/30 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#E9D5FF] uppercase tracking-wider">
                welcome back
              </p>
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                {texts.profile.greeting} {student.name} 👋
              </h1>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#A3E635] text-[#18181B] text-xs font-black shadow-xs">
                {student.standard}
              </span>
              {student.stream && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F472B6] text-white text-[10px] font-black max-w-[140px] truncate shadow-xs">
                  {student.stream}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Membership Button: Special Highlighted with Gold Gradient Ring/Badge -> /pricing */}
        <Link
          href="/pricing"
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-yellow-400/25 to-amber-500/20 dark:from-amber-500/25 dark:via-yellow-500/20 dark:to-amber-400/30 border-2 border-amber-400 dark:border-amber-400/80 shadow-md shadow-amber-400/10 flex items-center justify-between text-left group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-amber-950 font-black text-lg shadow-xs shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                  {texts.membership.cardTitle}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-2xs">
                  Pro
                </span>
              </div>
              <p className="text-[11px] font-bold text-amber-900/80 dark:text-amber-300/80 leading-snug">
                {texts.membership.cardSubtitle}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700 dark:text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        {/* 3. Hero-Level Lime Streak Card */}
        <StreakChip />

        {/* 4. Quiz of the Day (Gradient-Bordered, Invisible if null) */}
        <DailyQuizBox />

        {/* 5. Medal Leaderboard Box (🥇🥈🥉, Lime "me" row) */}
        <LeaderboardBox />

        {/* 6. Purple-Tinted Category Cards */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
              {targetClass} prep
            </h2>
            {student.stream && (
              <span className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] truncate max-w-[160px]">
                {student.stream}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/materials?category=${cat.id}`}
                className="min-h-[64px] p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] dark:from-[#1B0B2E] dark:to-[#2A1247] hover:from-[#F3E8FF] hover:to-[#EDE9FE] dark:hover:from-[#2A1247] dark:hover:to-[#3B2063] border border-[#DDD6FE] dark:border-[#3B2063] hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="font-extrabold text-xs text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                  {cat.label}
                </span>
                <ArrowRight className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Demo footnote if env vars missing and mock fallback used */}
        {isDemoContent && (
          <div className="pt-2 text-center">
            <span className="text-[10px] font-bold text-[#6D28D9]/40 dark:text-[#B9A6D9]/40 uppercase tracking-widest">
              {texts.states.demoFootnote}
            </span>
          </div>
        )}
      </div>
    );
  }

  // GUEST HOME SCREEN
  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 space-y-4 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* PWA Add to Home Screen Chip */}
      <PWAInstallChip />

      {/* 1. Medium switch: lives on guest home, big and thumb-friendly */}
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-sm transition-colors">
        <p className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-wider mb-2.5 text-center">
          {texts.home.chooseMedium}
        </p>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
          <button
            type="button"
            onClick={() => setMedium('english')}
            className={`min-h-[48px] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              medium === 'english'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30 scale-[1.01]'
                : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <span>English</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full">EN</span>
          </button>

          <button
            type="button"
            onClick={() => setMedium('tamil')}
            className={`min-h-[48px] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              medium === 'tamil'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30 scale-[1.01]'
                : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <span>தமிழ்</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full">TA</span>
          </button>
        </div>
      </div>

      {/* 2. Scheduled Quiz of the Day (Hidden if null) */}
      <DailyQuizBox />

      {/* 3. Choose your class header */}
      <div className="text-center pt-1">
        <span className="text-xs font-black uppercase text-[#7C3AED] dark:text-[#A78BFA] tracking-wider bg-[#F3E8FF] dark:bg-[#2A1247] px-3.5 py-1.5 rounded-full border border-[#DDD6FE] dark:border-[#3B2063]">
          {texts.home.chooseClass}
        </span>
      </div>

      {/* 3. Class Grid: 12th -> 6th (12th and 10th active, 12th FIRST) */}
      <div className="grid grid-cols-2 gap-3.5">
        {CLASSES.map((cls) => {
          if (cls.isAvailable) {
            return (
              <Link
                key={cls.level}
                href={`/class/${cls.level}`}
                className="min-h-[114px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] active:scale-[0.98] text-white rounded-2xl p-4 shadow-xl shadow-[#7C3AED]/25 flex flex-col justify-between transition-all cursor-pointer border border-[#8B5CF6]/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cls.emoji}</span>
                  {cls.tag && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] shadow-xs">
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
              className="min-h-[114px] bg-white dark:bg-[#1B0B2E]/60 hover:bg-[#F3E8FF]/30 dark:hover:bg-[#1B0B2E] active:scale-[0.98] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs flex flex-col justify-between transition-all cursor-pointer text-left opacity-75"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl opacity-60">{cls.emoji}</span>
                <span className="text-[10px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA] bg-[#F3E8FF] dark:bg-[#0F0618] px-2 py-0.5 rounded-full">
                  {texts.classes.soonBadge}
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-[#6D28D9]/70 dark:text-[#B9A6D9]/70">
                  {cls.level}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Demo footnote if env vars missing and mock fallback used */}
      {isDemoContent && (
        <div className="pt-2 text-center">
          <span className="text-[10px] font-bold text-[#6D28D9]/40 dark:text-[#B9A6D9]/40 uppercase tracking-widest">
            {texts.states.demoFootnote}
          </span>
        </div>
      )}
    </div>
  );
}
